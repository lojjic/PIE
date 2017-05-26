                                         ============================
                                         ======      PIE       ======
                                         ============================

                                                 Mmmmmm, pie.



`CSS Level 3`带来了一些非常强大的样式功能。 `圆角`，`柔和的阴影`，`渐变
填充`等等。 这些都是我们的设计师朋友喜欢使用的元素，因为它们使
站点更加具有吸引力，但实施起来总是很困难并且很耗时间，因为涉及复杂的精灵图，额外的非语义标记，
大型JavaScript库和其他可爱的hacks。


`CSS3`承诺要消除所有这些影响！ 但是大家都知道，由于`Internet Explorer`缺乏对这些任意特性的支持
，在可预见的未来，我们必须耐心的用同样旧的乏味的技巧来实现，而不去使用CSS3。
那我们到底如何做?


`PIE`代表`Progressive Internet Explorer`(渐进式的IE)。 它是`IE`附加的行为，当应用于元素时，允许
`IE`来识别和显示一些`CSS3`属性。 试想一下，如果你愿意的话，下面的CSS：
```
    #myElement {
        background: #EEE;
        padding: 2em;
        -moz-border-radius: 1em;
        -webkit-border-radius: 1em;
        border-radius: 1em;
    }
```
这样，除了`IE 6，7`或者`8`，都显示一个方框以外。在现代任意主流浏览器中都有一个圆角框， 然而，我们将以下单个规则添加到该CSS中：
```
    #myElement {
        ...
        behavior: url(PIE.htc);
    }
```

现在，完全相同的圆角出现在IE中！ 这就是它的一切。 是的，是真的，我的意思是。

`PIE`目前对以下`CSS3`特性有全面或部分的支持：

```

    * border-radius
    * box-shadow
    * border-image
    * multiple background images
    * linear-gradient as background image
```


我们正在开发其他功能，如`radial gradients`，`multiple box shadows`以及修复许多错误。 

但它仍然是
一个年轻的项目，并且还有很长的路要走，虽然它的效果已经相当显著了！ 

我们正在努力构建一个带有文档和示例的[网站](http://css3pie.com/)。 在此，对于贡献（代码，文档，测试）的开发者表示由衷的感谢！