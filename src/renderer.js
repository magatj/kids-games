/**
 * Cyber Shift: Apex Vanguard - RenderEngine
 * Handles WebGL rendering, lighting, shadows, atmospheric sky dome,
 * and high/low graphics quality scaling.
 */

export class RenderEngine {
  constructor(canvas) {
    const T = window.THREE;
    this.canvas = canvas;
    this.highQuality = true;

    // 1. WebGL Renderer with fallback
    try {
      this.renderer = new T.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e1) {
      try {
        this.renderer = new T.WebGLRenderer({
          canvas: this.canvas,
          antialias: false,
          powerPreference: 'default'
        });
      } catch (e2) {
        throw new Error('WebGL not supported: ' + (e2.message || e1.message));
      }
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // 2. Scene & Atmospheric Fog
    this.scene = new T.Scene();
    this.scene.fog = new T.FogExp2(0x121b2b, 0.0032);

    // 3. Sky Dome Shader
    this.buildSkyDome();

    // 4. Lighting Rig
    this.hemiLight = new T.HemisphereLight(0x75d5ff, 0x221326, 2.2);
    this.scene.add(this.hemiLight);

    // Sun with shadow mapping
    this.sun = new T.DirectionalLight(0xffbe85, 3.4);
    this.sun.position.set(-80, 120, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -85,
      right: 85,
      top: 85,
      bottom: -85,
      near: 1,
      far: 300
    });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.06;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Cyber Rim Light
    this.rimLight = new T.DirectionalLight(0x38dfff, 1.8);
    this.rimLight.position.set(45, 35, -70);
    this.scene.add(this.rimLight);

    // Distant Neon Sun / Cyber Moon disc
    const sunMat = new T.MeshBasicMaterial({ color: 0xffe2b8, fog: false });
    const sunMesh = new T.Mesh(new T.SphereGeometry(22, 24, 16), sunMat);
    sunMesh.position.set(-280, 110, -420);
    this.scene.add(sunMesh);

    // Window resize binding
    window.addEventListener('resize', () => this.onWindowResize());
  }

  buildSkyDome() {
    const T = window.THREE;
    const skyGeo = new T.SphereGeometry(650, 32, 16);
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide,
      uniforms: {
        topColor: { value: new T.Color('#08101e') },
        midColor: { value: new T.Color('#192b42') },
        horizonColor: { value: new T.Color('#ff8f5a') }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 col = mix(horizonColor, midColor, clamp(pow(max(h, 0.0), 0.5), 0.0, 1.0));
          col = mix(col, topColor, clamp(pow(max(h, 0.0), 1.8), 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const sky = new T.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  setQuality(isHigh) {
    this.highQuality = isHigh;
    const ratio = isHigh ? Math.min(window.devicePixelRatio || 1, 1.75) : 1.0;
    this.renderer.setPixelRatio(ratio);
    this.renderer.shadowMap.enabled = isHigh;

    if (this.sun) {
      this.sun.castShadow = isHigh;
      if (isHigh) {
        this.sun.shadow.mapSize.set(2048, 2048);
      }
    }

    this.scene.traverse((obj) => {
      if (obj.material) {
        obj.material.needsUpdate = true;
      }
    });

    return this.highQuality;
  }

  updateLightFollow(targetPos) {
    // Keep shadow map centered around the player
    this.sun.position.set(targetPos.x - 80, 120, targetPos.z + 60);
    this.sun.target.position.copy(targetPos);
  }

  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }
}
