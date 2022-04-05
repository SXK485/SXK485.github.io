import md5 from 'md5'
import { Test } from './test'
let options = [[ 'star', 2 ],[ 'star', 3 ], [ 'star', 4 ], [ 'star', 5 ], [ 'star', 6 ], [ 'spine', true ]]  //定义一个options数组，其中包含数组
let activateOptionIndex = 4    //定义激活选项索引变量，初始值为4，即anime-cg。过滤掉其他非当前索引的元素
let iconTableInited = false    //定义图标表初始化，初始值为false，表示尚未初始化
let test = null

domReady('charas', async charaTable => { //charaTable是id为chara-table的元素
  console.log('dom ready')
  const data = JSON.parse(await (await (fetch('./data.json'))).text())   //读取json文件，暂时不了解async和await的作用
  // console.log(typeof data)
  // console.log(data)
  // console.log(typeof charaTable)
  // console.log(charaTable)
  window.URL_PREFIX = data.URL_PREFIX    //定义全局变量，下同。  客户端 JavaScript 顶层对象。每当 <body> 或 <frameset> 标签出现时，window 对象就会被自动创建。
  window.URL_VER = data.URL_VER
  window.DEFAULT_ICON = data.DEFAULT_ICON
  showIconTable(data.charaData, charaTable)     //如果是第一次执行，activateOptionIndex = 4，进行图标初始化
  
  lazyload()
  window.addEventListener('scroll', lazyload, false)   //指定onscroll事件,当文档被滚动时，执行lazyload函数。  布尔值，指定事件是否在捕获或冒泡阶段执行。
                                           //true - 事件句柄在捕获阶段执行. false- false-默认。事件句柄在冒泡阶段执行

  let starsEl = ['star2','star3', 'star4', 'star5', 'star6', 'anime-cg']
  starsEl.forEach((star, index) => {  //star是数组的每一项，index表式索引
    let el = document.getElementById(star)
    // console.log(typeof el)
    // console.log(el)
    // console.log(index)
    el.onclick = () => {
      // console.log("el is implement?")
      activateOptionIndex = index   //将当前索引赋给激活选项索引变量
      Array.from(document.querySelectorAll('#star-panel button')).forEach(btn => btn.className = "")  //将所有button之前的class赋空值。相当于取消激活，每次只显示一个星级页面.这里的btn是一个元素
      if (options[index]) el.className = "activated"  //将类名"activated"赋予当前元素，代表被激活
      showIconTable(data.charaData, charaTable)
      lazyload()
    }
  })
})

function showIconTable(charaData, charaTable) {
  if (!iconTableInited) {   //若图标尚未初始化，执行以下代码.注意，这里初始化了所有图标，后面再通过display: none;隐藏过滤不需要的元素节点
    // console.log('开始初始化')
    const fragment = document.createDocumentFragment();
    for (let i = 0, icon = null, div = null; i < charaData.length; ++i) {
      div = document.createElement('div')     //创建一个div节点
      icon = document.createElement('img')    //创建一个img节点
      icon.className = 'chara-icon'
      icon.title = charaData[i].name
      icon.setAttribute('data-id', charaData[i].id)     //通过形参或全局变量设置属性值，下同
      icon.setAttribute('data-src', `${window.URL_PREFIX}/ultra/images/character/dmm/i/${md5(`icon_l_${charaData[i].id}`)}.bin${window.URL_VER}`)
      icon.setAttribute('src', window.DEFAULT_ICON)
      let hsceneId = charaData[i].id > 400000 ? `${charaData[i].id - 300000}_2` : charaData[i].id
      // icon.onclick = () => {
      //   loadHScene(hsceneId).then(lines => {
      //     if (story) cleanHScene(story)
      //     story = new Story('hs', lines)
      //     document.documentElement.scrollTop = 0
      //   })
      // }
      icon.onclick = () => {
        // console.log("onclick执行了！！")
        // console.log(document.querySelectorAll('canvas'))
        if(test){ 
          clearCanvas()
          test = null
        }
        document.getElementById("hs-frame").style.display="none";
        document.getElementById("hs-spine").style.display="block";
        document.getElementById("hs-container").style.opacity=1;  //当展示动画，父节点背景不透明度设为1
        // document.getElementById("range").style.display="block";
        test = new Test()
        // console.log(test)
        // console.log(document.querySelectorAll('canvas'))
        document.documentElement.scrollTop = 0
      }
      icon.addEventListener('error', () => {
        window.wrongPicList = window.wrongPicList || []
        window.wrongPicList.push(charaData[i].id)
      })
      div.appendChild(icon)  //appendChild方法可向节点的子节点列表的末尾添加新的子节点
      const label = document.createElement('p')   //创建p标签，用于显示人物名称
      label.innerText = charaData[i].name
      div.appendChild(label)
      fragment.appendChild(div)
      iconTableInited = true        //标志赋值真，表示已经初始化过了
    }
    charaTable.appendChild(fragment)
  }
  // apply filter 应用过滤器
  const icons = document.querySelectorAll('#charas > div')
  // if(activateOptionIndex == 4){
  //   console.log("第一次应用过滤器")
  // }
  // else
  //   console.log(`第${activateOptionIndex}次应用过滤器`)
  const filter = options[activateOptionIndex]
  for (let i = 0; i < charaData.length; ++i) {
    if (charaData[i][filter[0]] !== filter[1]) icons[i].style.display = 'none'   //charaData[i][filter[0]] => charaData[i]['spine']
    else icons[i].style.display = 'block'
  }
}

function domReady(id, callback) {
  let timer = window.setInterval(() => {  //setInterval按照指定的周期来调用函数,200毫秒1/5秒，可是在这里domReady只会执行一次
    let dom = document.getElementById(id)
    // console.log(dom)
    // console.log("test")
    if (dom) {
      window.clearInterval(timer)   //调用clearInterval方法，停止setInterval设定的定时执行操作
      callback && callback(dom)
    }
  }, 200)
}

function lazyload() {
  const imagesToLoad =  Array.from(document.querySelectorAll('#charas > div'))
    .filter(div => div.style.display !== 'none').map(div => div.children[0])    //filter过滤器方法过滤掉不为node的元素. children 属性返回元素的子元素的集合，是一个 HTMLCollection对象,即筛选出的img标签的集合
    .filter(img => img.src === window.DEFAULT_ICON)     //filter过滤器方法过滤掉加载不出的元素

  //经过过滤后imagesToLoad是一个只包含img元素的HTMLCollection对象,即一个表示 HTML 元素的集合
  const seeHeight = document.documentElement.clientHeight;     //获取可见区域高度
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;   //获取当前页面滚动条纵坐标的位置。
  // console.log(seeHeight)
  for (let i = 0; i < imagesToLoad.length; ++i)
    //如果img元素顶部偏移的像素值 小于 可见高度与滚动条纵坐标的和 ，就进行懒加载
    if (imagesToLoad[i].offsetTop < seeHeight + scrollTop) imagesToLoad[i].src = imagesToLoad[i].getAttribute('data-src')   //懒加载，解释看：https://blog.csdn.net/weixin_42581003/article/details/118203328
}

function clearCanvas(){
  let canvaes = document.querySelectorAll('canvas');
  for (var i = 0; i < canvaes.length; ++i) {
    canvaes[i].remove();
  }
}


