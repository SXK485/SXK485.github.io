import * as PIXI from "pixi.js";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import MD5 from "crypto-js/md5";
//import testHTML from "/index.html";
window.PIXI = PIXI;
require("pixi-spine");


export class Test {


  changeColor(){
    var value1 = document.getElementById("range1").value;
    var value2 = document.getElementById("range2").value;
    var value3 = document.getElementById("range3").value;
    var color = "rgb(" + value1 + "," + value2 + "," + value3 + ")";
    console.log(color)
    return color; 
  }

  
  
  constructor() {
    //txt的id不全，新建一个array数组
    const noSpine = new Array('140901','126401','150809','160803','162401','165601','169601','112807000')

    window.onclick = (e) => {
    // window.addEventListener('click', (e) => {  //addEventListener会事件多次绑定，改用onclick，后一次click绑定会覆盖调前一次
      // e.stopPropagation();
      if(e.target && e.target.className == 'chara-icon'){
        const strId = e.target.getAttribute('data-id')
        //const x = d.attr("id")
        let intId = Number(strId) 
        if(500000 > intId && intId > 400000) intId=intId-300000
        const d = intId + ""
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id") || `${d}`;

        
        // const color = this.changeColor();

                  
        const CryptoJS = { MD5 };

        // const SCREEN_W_PC = 960;
        // const SCREEN_H = 640;
        //const SPINE_SCALE = 0.36;
        //const FPS = 60;
        this.width = 960
        // this.height = 580
        const globalScale = 1.2;
        const spineGlobalScale = Number(document.getElementById("point").value);  //获取前端输入框值，设置缩放比例
        const app = new PIXI.Application({
        id: "spineanimation",
        width: this.width,        //画布宽度
        // height: this.height,
        height:this.width * 2 / 3,    //画布高度
        // backgroundColor: Node,
        backgroundColor: 0x666666,   //背景色
        // backgroundColor: color,
        transparent: false,   //背景无透明度
        preserveDrawingBuffer: true
        });
        app.view.style.zoom = `${100 / window.devicePixelRatio}%`;
        app.view.style.userSelect = "none";
        document.querySelector("#hs-spine").prepend(app.view);
        // console.log("canvas已经创建！")

        app.stage.interactive = true;
        app.stage.scale.set(globalScale, globalScale);

        const loadResources = (loader) => {
        return new Promise((resolve) => {
          loader.load((_, resources) => {
            resolve(resources);
          });
        });
        };

        const wait = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
        };

        const loadLegacyAnimation = (resources) => {
        const baseTexture = new PIXI.BaseTexture(resources.atlas.data);
        const data = JSON.parse(resources.json.data);

        // isKeyIsMotion
        const {
          filename,
          variable,
          size,
          keepminpixelarea,
          smalleffectscale,
          configData,
          matrixScalingSkewingTable,
          matrixMoveTable,
          spriteSheetTable,
          ver,
          ...animationsData
        } = data;

        // parseLowQualityMotionData
        const parsedAnimations = Object.entries(animationsData).map(
          ([name, rawFramesData]) => {
            const framesData = rawFramesData.map((frameData) => {
              if (!frameData) {
                return [];
              } else if (!ver || ver > 2) {
                return frameData;
              } else {
                return frameData.map(([a, b, c, d]) => {
                  return [
                    [...matrixScalingSkewingTable[a], ...matrixMoveTable[b]],
                    spriteSheetTable[c],
                    d && [d / 100]
                  ];
                });
              }
            });
            return { name, framesData };
          }
        );

        // parseLowQualityMotionData
        const animations = parsedAnimations.map(({ name, framesData }) => {
          const frames = framesData.map((frameData) => {
            const frame = new PIXI.Container();
            const sprites = frameData
              .map(([transformArr, rectArr, alphaArr]) => {
                let textureScale = 1;
                const rect = new PIXI.Rectangle(
                  rectArr[0] * textureScale,
                  rectArr[1] * textureScale,
                  rectArr[2] * textureScale,
                  rectArr[3] * textureScale
                );
                if (
                  keepminpixelarea > 0 &&
                  rect.width * rect.height > keepminpixelarea
                ) {
                  rect.width /= smalleffectscale || 2;
                  rect.height /= smalleffectscale || 2;
                  textureScale /= smalleffectscale || 2;
                }
                const texture = new PIXI.Texture(baseTexture, rect);

                const transform = new PIXI.Matrix()
                  .scale(1 / textureScale, 1 / textureScale)
                  .prepend(new PIXI.Matrix(...transformArr));
                const sprite = new PIXI.Sprite(texture);
                sprite.transform.setFromMatrix(transform);

                // getLowQualityMotionData
                if (alphaArr) {
                  sprite.alpha = alphaArr[0];
                }

                return sprite;
              })
              .filter((x) => x);
            for (const sprite of sprites) {
              frame.addChild(sprite);
            }
            return frame;
          });
          return { name, frames };
        });

        class AnimationsContainer extends PIXI.Container {
          constructor(ticker, animations) {
            super();
            this.ticker = ticker;
            this.animations = animations;
            this.animationIndex = 0;
            this.activeChildren = [];
            this.currentTime = 0;
            this.timeScale = 1;
          }

          destroy() {
            this.stop();
            super.destroy();
          }

          get activeAnimation() {
            return this.animations[this.animationIndex];
          }

          start() {
            this.ticker.add(this.update, this);
          }

          stop() {
            this.ticker.remove(this.update, this);
          }

          next() {
            this.animationIndex = (this.animationIndex + 1) % this.animations.length;
            this.currentTime = 0;
          }

          setActiveChild(child) {
            this.removeChildren();
            this.addChild(child);
          }

          update(deltaTime) {
            this.currentTime += this.timeScale * (deltaTime / 60);
            const frameIndex =
              Math.floor(this.currentTime * 30) % this.activeAnimation.frames.length;

            console.log("test")
            try {
              if(this.activeAnimation.frames.length == 0) return   //如果length为0，即该动作不存在时，跳过此动作，否则会出错
              this.setActiveChild(this.activeAnimation.frames[frameIndex]);
            } catch (error) {
              console.log(this.activeAnimation.name)
              console.log(frameIndex)
              console.log(this.activeAnimation.frames)
            }
            if (this.activeAnimation.name === "全体攻撃エフェクト") {
              this.x = 0;
              this.y = 0;
            } else {
              this.x = app.renderer.width / globalScale / 2;
              this.y = app.renderer.height / globalScale / 1.5;
            }
          }

          *stepFrames() {
            this.timeScale = 0;
            const totalFrames = this.activeAnimation.frames.length;
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
              this.currentTime = (frameIndex + 0.5) / 30;
              yield { frameIndex, totalFrames };
            }
            this.timeScale = 1;
          }
        }
        return new AnimationsContainer(app.ticker, animations);
        };

        const loadSpineAnimation = (resources, textureUrl) => {
        const spineAtlas = new PIXI.spine.core.TextureAtlas(
          resources.atlas.data,
          (line, callback) => {
            console.log(line)
            callback(PIXI.BaseTexture.from(textureUrl));
          }
        );

        // createSpineData
        const spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(
          spineAtlas
        );
        const spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);
        const spineData = spineJsonParser.readSkeletonData(resources.skeleton.data);

        // addChildSpine
        const spine = new PIXI.spine.Spine(spineData);
        
        if(spineGlobalScale == 0){ 
          spine.scale = new PIXI.Point(1, 1);
        }else{
        spine.scale = new PIXI.Point(spineGlobalScale, spineGlobalScale);}  //放大拉伸比例，1:1为原比例

        class AnimationsContainer extends PIXI.Container {
          constructor(spine) {
            super();
            this.spine = spine;
            this.animationIndex = 0;
            this.addChild(spine);
          }

          get activeAnimation() {
            const animations = spine.spineData.animations;
            return animations[this.animationIndex];
          }

          setAnimation() {
            const track = 0;
            const loop = true;
            this.spine.state.setAnimation(track, this.activeAnimation.name, loop);
          }

          start() {
            this.setAnimation();
          }

          next() {
            this.animationIndex =
              (this.animationIndex + 1) % spine.spineData.animations.length;
            if (this.activeAnimation.name === "allskilleffect") {
              spine.x = 0;
              spine.y = 0;
              // spine.x = app.renderer.width / globalScale / 15;
              // spine.y = app.renderer.height / globalScale / 15;
            } else {
              spine.x = app.renderer.width / globalScale / 2;
              spine.y = app.renderer.height / globalScale / 1.5;
            }
            this.setAnimation();
          }

          *stepFrames() {
            const state = this.spine.state;
            const track = state.tracks[0];
            state.timeScale = 0;
            const dt = 1 / 60;
            const totalFrames =
              Math.floor((track.animationEnd - track.animationStart) / dt) + 1;
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
              track.trackTime = track.animationStart + frameIndex * dt;
              yield { frameIndex, totalFrames };
            }
            state.timeScale = 1;
          }
        }
        return new AnimationsContainer(spine);
        };

        const assetsRoot =
        "https://dugrqaqinbtcq.cloudfront.net/product/ynnFQcGDLfaUcGhp/assets/";
        const run = async () => {
        const spineCharsRes = await fetch(
          `${assetsRoot}setting/dat/spine_character.txt`
        );
        const pcCharsRes = await fetch(
          `${assetsRoot}setting/dat/pc_sd_anime_character.txt`
        );
        const isSpine = (await spineCharsRes.text()).includes(id);   //includes方法不支持正则
        const isPC = (await pcCharsRes.text()).includes(id);
        let animationsContainer;
        if (!isSpine || noSpine.includes(id)) {  
          const sdRoot = `${assetsRoot}sdcharacter${isPC ? `_pc` : ``}`;
          const atlasHash = CryptoJS.MD5(`string${id}/chibi_${id}_atlas_`);
          const jsonHash = CryptoJS.MD5(`string${id}/chibi_${id}`);
          const resources = await loadResources(
            app.loader
              .add("atlas", `${sdRoot}/png/${atlasHash}.png`)
              .add("json", `${sdRoot}/dat/${jsonHash}.dat`)
          );
          animationsContainer = loadLegacyAnimation(resources);
        } else {
          const sdRoot = `${assetsRoot}sdcharacter_spine`;
          const hash = CryptoJS.MD5(`spinechibi_${id}`);
          const resources = await loadResources(
            app.loader
              .add("atlas", `${sdRoot}/${hash}.atlas`)
              .add("skeleton", `${sdRoot}/${hash}.json`)
          );
          animationsContainer = loadSpineAnimation(
            resources,
            `${sdRoot}/${hash}.png`
          );
        }
        const updateAnimationName = () => {
          document.querySelector("#animationName").innerText =
            animationsContainer.activeAnimation.name;
        };

        app.stage.addChild(animationsContainer);

        animationsContainer.start();
        updateAnimationName();

        const allowClickingAnywhere = (element) => {
          const backdrop = new PIXI.Container();
          backdrop.interactive = true;
          backdrop.containsPoint = () => true;
          element.addChild(backdrop);
        };
        allowClickingAnywhere(app.stage);

        const downloadButton = document.querySelector("#download");

        app.stage.on("click", () => {
          if (!downloadButton.disabled) {
            animationsContainer.next();
            updateAnimationName();
          }
        });

         //移动端onclick事件失效，添加ontouchstart事件以支持移动端
        app.stage.on("touchstart", function () {
          if (!downloadButton.disabled) {
            animationsContainer.next();
            updateAnimationName();
          }
        });

        //给id为download的元素给绑定事件，点击后将当前动作逐帧截图下载，保存为zip
        downloadButton.onclick = async (e) => {
          e.target.disabled = true;
          const originalText = e.target.innerText;
          const zip = new JSZip();
          for (let { frameIndex, totalFrames } of animationsContainer.stepFrames()) {
            if (frameIndex === 0) {
              await wait(50); // wait for render to reset on first frame
            }
            e.target.innerText = `Rendering... ${frameIndex + 1} / ${totalFrames}`;
            const blob = await new Promise((resolve) => {
              app.view.toBlob(resolve);
            });
            zip.file(`${frameIndex.toString().padStart(3, "0")}.png`, blob);
          }
          e.target.innerText = `Creating zip file...`;
          const zipBlob = await zip.generateAsync({ type: "blob" });
          saveAs(zipBlob, `${animationsContainer.activeAnimation.name}.zip`);
          e.target.disabled = false;
          e.target.innerText = originalText;
        };
        };
        run();
      }
    }
  }
}


