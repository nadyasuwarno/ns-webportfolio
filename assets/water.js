/* The landing water: one pale blue gradient, still until touched.
   Ripples move slowly and softly. Pressing it lets a drop fall, then opens the link. */
(() => {
  const link = document.getElementById('water');
  const canvas = link && link.querySelector('canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return;
  if (!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return;
  gl.getExtension('OES_texture_float_linear');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VS = `#version 300 es
  in vec2 p; out vec2 uv;
  void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;

  const SIM = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D s; uniform vec2 px; uniform vec2 a,b; uniform float force,rad,aspect;
  void main(){
    vec4 c=texture(s,uv);
    vec4 l=texture(s,uv-vec2(px.x,0.)), r=texture(s,uv+vec2(px.x,0.)), d=texture(s,uv-vec2(0.,px.y)), u=texture(s,uv+vec2(0.,px.y));
    float avg=(l.r+r.r+d.r+u.r)*.25;
    float h=c.r, v=c.g;
    v+=(avg-h)*.42;
    float edge=smoothstep(0.,.03,uv.x)*smoothstep(0.,.03,1.-uv.x)*smoothstep(0.,.03,uv.y)*smoothstep(0.,.03,1.-uv.y);
    v*=mix(.97,.9945,edge);
    h=(h+v)*.9994;
    if(force>0.){
      vec2 P=vec2(uv.x*aspect,uv.y), A=vec2(a.x*aspect,a.y), B=vec2(b.x*aspect,b.y);
      vec2 pa=P-A, ba=B-A; float t=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);
      float e=length(pa-ba*t), m=exp(-e*e/(rad*rad));
      v-=force*m;
    }
    o=vec4(h,v,0.,1.);
  }`;

  // A smooth blue gradient. The only thing that moves is soft light on the surface.
  const VIEW = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D s; uniform vec2 px;
  void main(){
    float e=5.;
    float l=texture(s,uv-vec2(px.x*e,0.)).r, r=texture(s,uv+vec2(px.x*e,0.)).r;
    float d=texture(s,uv-vec2(0.,px.y*e)).r, u=texture(s,uv+vec2(0.,px.y*e)).r;
    vec2 g=vec2(r-l,u-d)*25.;
    float light=dot(g,normalize(vec2(-.6,.8)));
    light=light/(1.+1.6*abs(light));
    float t=smoothstep(-.1,1.1,uv.y*.82+uv.x*.18);
    vec3 col=mix(vec3(.690,.780,.875),vec3(.930,.950,.975),t);
    col+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5)/255.;
    col+=light>0.?light*vec3(.16,.14,.10):light*vec3(.26,.22,.17);
    o=vec4(col,1.);
  }`;

  function program(fs) {
    const pg = gl.createProgram();
    [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].forEach(([t, src]) => {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      gl.attachShader(pg, sh);
    });
    gl.bindAttribLocation(pg, 0, 'p');
    gl.linkProgram(pg);
    const u = {};
    const n = gl.getProgramParameter(pg, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(pg, i); u[a.name] = gl.getUniformLocation(pg, a.name); }
    return { pg, u };
  }
  const simP = program(SIM), viewP = program(VIEW);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function target(w, h, internal, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb };
  }

  let W, H, aspect, simW, simH, simA, simB;
  function resize() {
    const box = link.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.max(2, Math.round(box.width * dpr)); H = Math.max(2, Math.round(box.height * dpr));
    canvas.width = W; canvas.height = H; aspect = W / H;
    simH = Math.round(240 / Math.max(aspect, 1)); simW = Math.round(simH * aspect);
    [simA, simB].forEach(t => { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); } });
    simA = target(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    simB = target(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    draw();
  }

  function step(a, b, force, rad) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, simB.fb); gl.viewport(0, 0, simW, simH);
    gl.useProgram(simP.pg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simA.tex);
    gl.uniform1i(simP.u.s, 0);
    gl.uniform2f(simP.u.px, 1 / simW, 1 / simH);
    gl.uniform2f(simP.u.a, a[0], a[1]); gl.uniform2f(simP.u.b, b[0], b[1]);
    gl.uniform1f(simP.u.force, force);
    gl.uniform1f(simP.u.rad, rad); gl.uniform1f(simP.u.aspect, aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [simA, simB] = [simB, simA];
  }

  function draw() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(viewP.pg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simA.tex);
    gl.uniform1i(viewP.u.s, 0);
    gl.uniform2f(viewP.u.px, 1 / simW, 1 / simH);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const STEP = 1000 / 60, queue = [];
  let raf = 0, last = 0, acc = 0, lastTouch = -1e9, cur = null;

  function frame(t) {
    raf = 0;
    acc += Math.min(t - last, 50); last = t;
    let n = 0;
    while (acc >= STEP && n < 3) {
      const q = queue.shift();
      if (q) step(q.a, q.b, q.force, q.rad);
      else step([0, 0], [0, 0], 0, 1);
      acc -= STEP; n++;
    }
    while (queue.length) { const q = queue.shift(); step(q.a, q.b, q.force, q.rad); }
    draw();
    if (performance.now() - lastTouch < 60000) raf = requestAnimationFrame(frame);
  }
  function wake() {
    lastTouch = performance.now();
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function toUv(e) {
    const b = link.getBoundingClientRect();
    return [(e.clientX - b.left) / b.width, 1 - (e.clientY - b.top) / b.height];
  }

  resize();
  if (reduced) { addEventListener('resize', resize); return; }

  link.addEventListener('pointermove', e => {
    const p = toUv(e);
    if (!cur) { cur = p; return; }
    const sp = Math.hypot((p[0] - cur[0]) * aspect, p[1] - cur[1]);
    queue.push({ a: cur, b: p, force: Math.min(.00022 + sp * .009, .0006), rad: .046 });
    cur = p; wake();
  });
  link.addEventListener('pointerleave', () => { cur = null; });

  let leaving = false;
  link.addEventListener('click', e => {
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    const p = e.detail ? toUv(e) : [.5, .5];
    queue.push({ a: p, b: p, force: .0048, rad: .064 });
    wake();
    setTimeout(() => { location.href = link.href; }, 650);
  });
  addEventListener('pageshow', e => { if (e.persisted) leaving = false; });

  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 140); });
})();
