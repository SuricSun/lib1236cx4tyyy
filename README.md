# lib1236cx4tyyy

前端JS库

## 计时器

```javascript
__.start_fps_timer(
    500,
    /*
     如果此参数是duration，第一个500代表每500ms触发一次下面的回调函数
     下面的1000代表1000ms后结束计时器
     如果此参数是count，第一个500代表每500帧触发一次下面的回调函数
     下面的1000代表100帧后结束计时器
    */
    "duration/count",
    1000,
    callback_func
);
```

## 属性插值动画

```javascript
__.animate(
    div, //要动画的html元素
    {
        width: "0%"
    }, //起始动画属性(可留空{}或null)
    {
        width: "100%"
    }, //终止动画属性(不可留空，否则不会进行任何插值)
    "ease-in-out", //缓动函数
    1000 //动画运行时间ms
);
```

## Fete模板引擎

```javascript
//定义模板(也可以从服务器下载)
//模板中${data}就代表最后面实例化传入的对象
//可以使用${data.*.*}进行正常的层级访问
let div_template = `
    <[template]%
        \${data.name}
    %>
    // 等待更新
    <[template_arr]%
   
    %>
    // 等待更新
    <[str]%
   
    %>
    // 等待更新
    <[dom]%
   
    %>
`;

//解析此模板到缓存并起一个名字叫"template"，以加速下次实例化
__.fete.parse_to_cache("template", div_template);

//用数据实例化上面解析的模板
document.body.appendChild(
    __fete.render("template", {name: "name"}, null)
);
```