/* The landing water: a small wave simulation drawn in the site's blue duotone.
   Still until touched. Pressing it lets a drop fall, then opens the link. */
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

  // The bed under the water: slow cyanotype bands with a fine film grain.
  const BED = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform float aspect;
  float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*n(p); p=mat2(1.6,1.2,-1.2,1.6)*p+7.; a*=.5; } return s; }
  vec3 duo(float v){
    vec3 a=vec3(.243,.282,.435), b=vec3(.341,.380,.525), c=vec3(.486,.533,.655), d=vec3(.824,.859,.894), e=vec3(.910,.933,.949);
    if(v<.25) return mix(a,b,v/.25);
    if(v<.45) return mix(b,c,(v-.25)/.20);
    if(v<.75) return mix(c,d,(v-.45)/.30);
    return mix(d,e,(v-.75)/.25);
  }
  void main(){
    vec2 q=vec2(uv.x*aspect,uv.y);
    float a=fbm(vec2(q.x*.9,q.y*1.5)+3.), b=fbm(vec2(q.x*1.2,q.y*.9)+9.);
    float hb=.5+.5*sin(q.y*9.+a*5.+b*3.);
    float vb=.5+.5*sin(q.x*5.+b*6.);
    float v=smoothstep(.08,.92,hb*.56+vb*.12+a*.32);
    v=.10+.84*v;
    v+=(h(gl_FragCoord.xy*.37)-.5)*.075+(h(gl_FragCoord.yx*.71+3.)-.5)*.045;
    o=vec4(duo(clamp(v,0.,1.)),1.);
  }`;

  const SIM = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D s; uniform vec2 px; uniform vec2 a,b; uniform float force,ink,rad,aspect;
  void main(){
    vec4 c=texture(s,uv);
    vec4 l=texture(s,uv-vec2(px.x,0.)), r=texture(s,uv+vec2(px.x,0.)), d=texture(s,uv-vec2(0.,px.y)), u=texture(s,uv+vec2(0.,px.y));
    float avg=(l.r+r.r+d.r+u.r)*.25;
    float h=c.r, v=c.g;
    v+=(avg-h)*1.2-h*.009;
    float edge=smoothstep(0.,.03,uv.x)*smoothstep(0.,.03,1.-uv.x)*smoothstep(0.,.03,uv.y)*smoothstep(0.,.03,1.-uv.y);
    v*=mix(.965,.9972,edge);
    h+=v;
    vec2 g=vec2(r.r-l.r,u.r-d.r);
    float dye=texture(s,uv-g*.022).b;
    dye=mix(dye,(l.b+r.b+d.b+u.b)*.25,.10)*.99965;
    if(force>0.){
      vec2 P=vec2(uv.x*aspect,uv.y), A=vec2(a.x*aspect,a.y), B=vec2(b.x*aspect,b.y);
      vec2 pa=P-A, ba=B-A; float t=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);
      float e=length(pa-ba*t), m=exp(-e*e/(rad*rad));
      v-=force*m; dye+=ink*m;
    }
    o=vec4(h,v,min(dye,1.),1.);
  }`;

  // Light through moving water: refraction, focused caustics, sky glints, ink.
  const VIEW = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D s,bed; uniform vec2 px; uniform float aspect;
  void main(){
    float e=1.5;
    float l=texture(s,uv-vec2(px.x*e,0.)).r, r=texture(s,uv+vec2(px.x*e,0.)).r;
    float d=texture(s,uv-vec2(0.,px.y*e)).r, u=texture(s,uv+vec2(0.,px.y*e)).r;
    float c=texture(s,uv).r;
    vec2 g=vec2(r-l,u-d);
    vec3 N=normalize(vec3(-g*15.,1.));
    vec2 off=N.xy*vec2(.040/aspect,.040);
    vec3 col=vec3(texture(bed,uv+off*.96).r,texture(bed,uv+off).g,texture(bed,uv+off*1.05).b);
    float dye=smoothstep(0.,1.,texture(s,uv+off).b);
    col=mix(col,vec3(.170,.205,.345),min(dye,.82));
    float focus=clamp(((l+r+d+u)*.25-c)*7.,-.20,.42);
    col*=1.+focus;
    vec3 L=normalize(vec3(-.46,.62,.64));
    float diff=dot(N,L)-L.z;
    col+=vec3(.70,.76,.86)*diff/(1.+4.*abs(diff));
    float fres=pow(1.-clamp(N.z,0.,1.),2.2);
    col=mix(col,vec3(.890,.925,.960),clamp(fres*3.4,0.,.46));
    vec3 H=normalize(L+vec3(0.,0.,1.));
    float base=pow(H.z,160.);
    col+=max(pow(max(dot(N,H),0.),160.)-base,0.)*vec3(.92,.96,1.)*1.15;
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
  const bedP = program(BED), simP = program(SIM), viewP = program(VIEW);

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

  let W, H, aspect, simW, simH, simA, simB, bed;
  function resize() {
    const box = link.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.max(2, Math.round(box.width * dpr)); H = Math.max(2, Math.round(box.height * dpr));
    canvas.width = W; canvas.height = H; aspect = W / H;
    simH = Math.round(360 / Math.max(aspect, 1)); simW = Math.round(simH * aspect);
    [simA, simB, bed].forEach(t => { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); } });
    simA = target(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    simB = target(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    bed = target(W, H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bed.fb); gl.viewport(0, 0, W, H);
    gl.useProgram(bedP.pg); gl.uniform1f(bedP.u.aspect, aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    draw();
  }

  function step(a, b, force, ink, rad) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, simB.fb); gl.viewport(0, 0, simW, simH);
    gl.useProgram(simP.pg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simA.tex);
    gl.uniform1i(simP.u.s, 0);
    gl.uniform2f(simP.u.px, 1 / simW, 1 / simH);
    gl.uniform2f(simP.u.a, a[0], a[1]); gl.uniform2f(simP.u.b, b[0], b[1]);
    gl.uniform1f(simP.u.force, force); gl.uniform1f(simP.u.ink, ink);
    gl.uniform1f(simP.u.rad, rad); gl.uniform1f(simP.u.aspect, aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [simA, simB] = [simB, simA];
  }

  function draw() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(viewP.pg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, simA.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bed.tex);
    gl.uniform1i(viewP.u.s, 0); gl.uniform1i(viewP.u.bed, 1);
    gl.uniform2f(viewP.u.px, 1 / simW, 1 / simH); gl.uniform1f(viewP.u.aspect, aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const STEP = 1000 / 60, queue = [];
  let raf = 0, last = 0, acc = 0, lastTouch = -1e9, cur = null;

  function frame(t) {
    raf = 0;
    acc += Math.min(t - last, 50); last = t;
    let n = 0;
    while (acc >= STEP && n < 3) {
      for (let i = 0; i < 3; i++) {
        const q = queue.shift();
        if (q) step(q.a, q.b, q.force, q.ink, q.rad);
        else step([0, 0], [0, 0], 0, 0, 1);
      }
      acc -= STEP; n++;
    }
    while (queue.length) { const q = queue.shift(); step(q.a, q.b, q.force, q.ink, q.rad); }
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
    queue.push({ a: cur, b: p, force: Math.min(.0024 + sp * .14, .012), ink: Math.min(.006 + sp * .14, .022), rad: .014 });
    cur = p; wake();
  });
  link.addEventListener('pointerleave', () => { cur = null; });

  let leaving = false;
  link.addEventListener('click', e => {
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    const p = e.detail ? toUv(e) : [.5, .5];
    queue.push({ a: p, b: p, force: .15, ink: .55, rad: .030 });
    wake();
    setTimeout(() => { location.href = link.href; }, 650);
  });
  addEventListener('pageshow', e => { if (e.persisted) leaving = false; });

  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 140); });
})();
