/**
 * WinBox.js
 * Author and Copyright: Thomas Wilkerling
 * Licence: Apache-2.0
 * Hosted by Nextapps GmbH
 * https://github.com/nextapps-de/winbox
 */

// TODO: rename control amd state classes (min, max, modal, focus, ...) #62

import template from "./template.js";
import { addListener, removeListener, setStyle, setText, getByClass, addClass, removeClass, hasClass, preventEvent } from "./helper.js";

//const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window["MSStream"];

const use_raf = false;
const stack_min = [];
const stack_win = [];
// use passive for touch and mouse wheel
const eventOptions = { "capture": true, "passive": false };
const eventOptionsPassive = { "capture": true, "passive": true };
let body;
let id_counter = 0;
let index_counter = 10;
let is_fullscreen;
let prefix_request;
let prefix_exit;
let root_w, root_h;
let window_clicked;

/**
 * @param {string|Object=} params
 * @param {Object=} _title
 * @constructor
 * @this WinBox
 */

function WinBox(params, _title){
    /*
    setInterval(() => {
        this.updatePerspective();
    }, 200);*/

    if(!(this instanceof WinBox)) {

        return new WinBox(params);
    }

    body || setup();

    let id,
        index,
        root,
        tpl,
        title,
        icon,
        taskbaricon,
        taskbariconcolor,
        mount,
        html,
        url,

        width,
        height,
        minwidth,
        minheight,
        maxwidth,
        maxheight,
        autosize,
        overflow,

        x,
        y,

        top,
        left,
        bottom,
        right,

        min,
        max,
        hidden,
        modal,

        background,
        border,
        header,
        classname,

        oncreate,
        onclose,
        onfocus,
        onblur,
        onmove,
        onresize,
        onfullscreen,
        onmaximize,
        onminimize,
        onrestore,
        onhide,
        onshow,
        onload,

        titleHeight;

    if(params){

        if(_title){

            title = params;
            params = _title;
        }

        if(typeof params === "string"){

            title = params;
        }
        else{

            id = params["id"];
            index = params["index"];
            root = params["root"];
            tpl = params["template"];
            title = title || params["title"];
            icon = params["icon"];
            taskbaricon = params["taskbaricon"];
            taskbariconcolor = params["taskbariconcolor"];
            mount = params["mount"];
            html = params["html"];
            url = params["url"];

            width = params["width"];
            height = params["height"];
            minwidth = params["minwidth"];
            minheight = params["minheight"];
            maxwidth = params["maxwidth"];
            maxheight = params["maxheight"];
            autosize = params["autosize"];
            overflow = params["overflow"];

            min = params["min"];
            max = params["max"];
            hidden = params["hidden"];
            modal = params["modal"];

            x = params["x"] || (modal ? "center" : 0);
            y = params["y"] || (modal ? "center" : 0);

            top = params["top"];
            left = params["left"];
            bottom = params["bottom"];
            right = params["right"];

            background = params["background"];
            border = params["border"];
            header = params["header"];
            classname = params["class"];

            oncreate = params["oncreate"];
            onclose = params["onclose"];
            onfocus = params["onfocus"];
            onblur = params["onblur"];
            onmove = params["onmove"];
            onresize = params["onresize"];
            onfullscreen = params["onfullscreen"];
            onmaximize = params["onmaximize"];
            onminimize = params["onminimize"];
            onrestore = params["onrestore"];
            onhide = params["onhide"];
            onshow = params["onshow"];
            onload = params["onload"];

            titleHeight = params["titleHeight"];
        }
    }

    this.dom = template(tpl);
    this.dom.id = this.id = id || ("winbox-" + (++id_counter));
    this.dom.className = "winbox" + (classname ? " " + (typeof classname === "string" ? classname : classname.join(" ")) : "") + (modal ? " modal" : "");
    this.dom["winbox"] = this;
    this.window = this.dom;
    this.body = getByClass(this.dom, "wb-body");
    this.header = header || 35;
    //this.plugins = [];

    stack_win.push(this);

    if(background){

        this.setBackground(background);
    }

    if(border){

        setStyle(this.body, "margin", border + (isNaN(border) ? "" : "px"));
    }
    else{

        border = 0;
    }

    if(header){

        const node = getByClass(this.dom, "wb-header");
        setStyle(node, "height", header + "px");
        setStyle(node, "line-height", header + "px");
        setStyle(this.body, "top", header + "px");
    }

    if(title){

        this.setTitle(title);
    }

    if(icon){

        this.setIcon(icon);
    }

    if(taskbaricon){

        // empty
    }

    if(taskbariconcolor){

        // empty
    }

    if(mount){

        this.mount(mount);
    }
    else if(html){

        this.body.innerHTML = html;
    }
    else if(url){

        this.setUrl(url, onload);
    }

    top = top ? parse(top, root_h) : 0;
    bottom = bottom ? parse(bottom, root_h) : 0;
    left = left ? parse(left, root_w) : 0;
    right = right ? parse(right, root_w) : 0;

    const viewport_w = root_w - left - right;
    const viewport_h = root_h - top - bottom;

    maxwidth = maxwidth ? parse(maxwidth, viewport_w) : viewport_w;
    maxheight = maxheight ? parse(maxheight, viewport_h) : viewport_h;
    minwidth = minwidth ? parse(minwidth, maxwidth) : 150;
    minheight = minheight ? parse(minheight, maxheight) : this.header;

    if(autosize){

        (root || body).appendChild(this.body);

        width = Math.max(Math.min(this.body.clientWidth + border * 2 + 1, maxwidth), minwidth);
        height = Math.max(Math.min(this.body.clientHeight + this.header + border + 1, maxheight), minheight);

        this.dom.appendChild(this.body);
    }
    else{

        width = width ? parse(width, maxwidth) : Math.max(maxwidth / 2, minwidth) | 0;
        height = height ? parse(height, maxheight) : Math.max(maxheight / 2, minheight) | 0;
    }

    x = x ? parse(x, viewport_w, width) : left;
    y = y ? parse(y, viewport_h, height) : top;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minwidth = minwidth;
    this.minheight = minheight;
    this.maxwidth = maxwidth;
    this.maxheight = maxheight;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
    this.index = index;
    this.overflow = overflow;
    //this.border = border;
    this.min = false;
    this.max = false;
    this.full = false;
    this.hidden = false;
    this.focused = false;

    this.onclose = onclose;
    this.onfocus = onfocus;
    this.onblur = onblur;
    this.onmove = onmove;
    this.onresize = onresize;
    this.onfullscreen = onfullscreen;
    this.onmaximize = onmaximize;
    this.onminimize = onminimize;
    this.onrestore = onrestore;
    this.onhide = onhide;
    this.onshow = onshow;

    if(hidden){

        this.hide();
    }
    else{

        this.focus();
    }

    if(index || (index === 0)){

        this.index = index;
        setStyle(this.dom, "z-index", index);
        if(index > index_counter) index_counter = index;
    }

    if(max){
        this.maximize();
    }
    else if(min){

        this.minimize();
    }
    else{

        this.resize().move();
    }

    register(this);
    (root || body).appendChild(this.dom);
    oncreate && oncreate.call(this, params);

    this.addClass("open");

    //console.log(this, this.dom);

    const taskbar = document.querySelector(".taskbaricons");
    taskbar.insertAdjacentHTML(
        "beforeend",
        `<span class="taskbaricon open" id="${this.id}_app" onclick="focusbox('${this.id}')" style="color: ${taskbariconcolor}">
            ${taskbaricon ? `<img draggable="false" src="${taskbaricon}">` : ""}
            <!--<span class="taskbaricontext">${this.title}</span>-->
        </span>`
    );

    const app = document.getElementById(`${this.id}_app`);
    let appTimeout = setTimeout(() => app.classList.remove("open"), 250);
    let domTimeout = setTimeout(() => this.removeClass("open"), 375);

    const observer = new MutationObserver(() => {
        if (document.documentElement.classList.contains("frozen")) {
            clearTimeout(appTimeout);
            clearTimeout(domTimeout);
            
            appTimeout = setTimeout(() => app.classList.remove("open"), 3000);
            domTimeout = setTimeout(() => this.removeClass("open"), 3000);
            
            observer.disconnect();
        }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    setTimeout(() => observer.disconnect(), 3000);
}

WinBox["new"] = function(params){

    return new WinBox(params);
};

WinBox["stack"] = function(){

    return stack_win;
};

export default WinBox;

/**
 * @param {number|string} num
 * @param {number} base
 * @param {number=} center
 * @return number
 */

function parse(num, base, center){

    if(typeof num === "string"){

        if(num === "center"){

            num = ((base - center) / 2 + 0.5) | 0;
        }
        else if(num === "right" || num === "bottom"){

            num = (base - center);
        }
        else{

            const value = parseFloat(num);
            const unit = (("" + value) !== num) && num.substring(("" + value).length);

            if(unit === "%"){

                num = (base / 100 * value + 0.5) | 0;
            }
            else{

                num = value;
            }
        }
    }

    return num;
}

function setup(){

    body = document.body;

    body[prefix_request = "requestFullscreen"] ||
    body[prefix_request = "msRequestFullscreen"] ||
    body[prefix_request = "webkitRequestFullscreen"] ||
    body[prefix_request = "mozRequestFullscreen"] ||
    (prefix_request = "");

    prefix_exit = prefix_request && (

        prefix_request.replace("request", "exit")
                      .replace("mozRequest", "mozCancel")
                      .replace("Request", "Exit")
    );

    addListener(window, "resize", function(){

        init();
        update_min_stack();

        // TODO adjust window sizes #151

        // for(let i = 0; i < stack_win.length; i++){
        //
        //     stack_win[i].resize().move();
        // }
    });

    addListener(body, "mousedown", function(event){

        window_clicked = false;

    }, true);

    addListener(body, "mousedown", function(event){

        if(!window_clicked){

            const stack_length = stack_win.length;

            if(stack_length){

                for(let i = stack_length - 1; i >= 0; i--){

                    const last_focus = stack_win[i];

                    if(last_focus.focused){

                        last_focus.blur();
                        break;
                    }
                }
            }
        }
    });

    init();
}

/**
 * @param {WinBox} self
 */

function register(self){

    addWindowListener(self, "drag");
    addWindowListener(self, "n");
    addWindowListener(self, "s");
    addWindowListener(self, "w");
    addWindowListener(self, "e");
    addWindowListener(self, "nw");
    addWindowListener(self, "ne");
    addWindowListener(self, "se");
    addWindowListener(self, "sw");

    addListener(getByClass(self.dom, "wb-min"), "click", function(event){

        preventEvent(event);
        self.min ? self.restore().focus() : self.minimize();
    });

    addListener(getByClass(self.dom, "wb-max"), "click", function(event){

        preventEvent(event);
        self.max ? self.restore().focus() : self.maximize().focus();
    });

    if(prefix_request){

        addListener(getByClass(self.dom, "wb-full"), "click", function(event){

            preventEvent(event);
            self.fullscreen().focus();
        });
    }
    else{

        self.addClass("no-full");
    }

    addListener(getByClass(self.dom, "wb-close"), "click", function(event){

        preventEvent(event);
        self.close() || (self = null);
    });

    addListener(self.dom, "mousedown", function(event){

        window_clicked = true;

    }, true);

    addListener(self.body, "mousedown", function(event){

        // stop propagation would disable global listeners used inside window contents
        // use event bubbling for this listener to skip this handler by the other click listeners
        self.focus();

    }, true);
}

/**
 * @param {WinBox} self
 */

function remove_min_stack(self){

    stack_min.splice(stack_min.indexOf(self), 1);
    update_min_stack();
    self.removeClass("min");
    self.min = false;
    self.dom.title = "";
}

function update_min_stack(){

    const length = stack_min.length;
    const splitscreen_index = {};
    const splitscreen_length = {};

    for(let i = 0, self, key; i < length; i++){

        self = stack_min[i];
        key = self.left + ":" + self.top;

        if(splitscreen_length[key]){

            splitscreen_length[key]++;
        }
        else{

            splitscreen_index[key] = 0;
            splitscreen_length[key] = 1;
        }
    }

    for(let i = 0, self, key, width; i < length; i++){

        self = stack_min[i]
        key = self.left + ":" + self.top;
        width = Math.min((root_w - self.left - self.right) / splitscreen_length[key], 250);
        self.resize((width + 1) | 0, self.header, true)
            .move((self.left + splitscreen_index[key] * width) | 0, root_h - self.bottom - self.header, true);
        splitscreen_index[key]++;
    }
}

/**
 * @param {WinBox} self
 * @param {string} dir
 */

function addWindowListener(self, dir){

    const node = getByClass(self.dom, "wb-" + dir);
    if(!node) return;

    let touch, x, y;
    let raf_timer, raf_move, raf_resize;
    let dblclick_timer = 0;

    addListener(node, "mousedown", mousedown, eventOptions);
    addListener(node, "touchstart", mousedown, eventOptions);

    function loop(){

        raf_timer = requestAnimationFrame(loop);

        if(raf_resize){

            self.resize();
            raf_resize = false;
        }

        if(raf_move){

            self.move();
            raf_move = false;
        }
    }

    function mousedown(event){

        // prevent the full iteration through the fallback chain of a touch event (touch > mouse > click)
        preventEvent(event, true);
        //window_clicked = true;
        self.focus();

        if(dir === "drag"){

            if(self.min){

                self.restore();
                return;
            }

            if(!self.hasClass("no-max") && !self.hasClass("dis-max")){

                const now = Date.now();
                const diff = now - dblclick_timer;

                dblclick_timer = now;

                if(diff < 300){

                    self.max ? self.restore() : self.maximize();
                    return;
                }
            }
        }

        if(/*!self.max &&*/ !self.min){

            addClass(body, "wb-lock");
            use_raf && loop();

            if((touch = event.touches) && (touch = touch[0])){

                event = touch;

                // TODO: fix when touch events bubbles up to the document body
                //addListener(self.dom, "touchmove", preventEvent);
                addListener(window, "touchmove", handler_mousemove, eventOptionsPassive);
                addListener(window, "touchend", handler_mouseup, eventOptionsPassive);
            }
            else{

                //addListener(this, "mouseleave", handler_mouseup);
                addListener(window, "mousemove", handler_mousemove, eventOptionsPassive);
                addListener(window, "mouseup", handler_mouseup, eventOptionsPassive);
            }

            x = event.pageX;
            y = event.pageY;

            // appearing scrollbars on the root element does not trigger "window.onresize",
            // force refresh window size via init(), also force layout recalculation (layout trashing)
            // it is probably very rare that the body overflow changes between window open and close

            //init();
        }
    }

    function handler_mousemove(event){

        preventEvent(event);

        if(touch){

            event = event.touches[0];
        }

        const pageX = event.pageX;
        const pageY = event.pageY;
        const offsetX = pageX - x;
        const offsetY = pageY - y;

        const old_w = self.width;
        const old_h = self.height;
        const old_x = self.x;
        const old_y = self.y;

        let resize_w, resize_h, move_x, move_y;

        if(dir === "drag"){

            if(self.hasClass("no-move")) return;

            self.x += offsetX;
            self.y += offsetY;
            move_x = move_y = 1;
        }
        else{

            if(dir === "e" || dir === "se" || dir === "ne"){

                self.width += offsetX;
                resize_w = 1;
            }
            else if(dir === "w" || dir === "sw" || dir === "nw"){

                self.x += offsetX;
                self.width -= offsetX;
                resize_w = 1;
                move_x = 1;
            }

            if(dir === "s" || dir === "se" || dir === "sw"){

                self.height += offsetY;
                resize_h = 1;
            }
            else if(dir === "n" || dir === "ne" || dir === "nw"){

                self.y += offsetY;
                self.height -= offsetY;
                resize_h = 1;
                move_y = 1;
            }
        }

        if(resize_w){

            self.width = self.width//Math.max(Math.min(self.width, self.maxwidth, root_w - self.x - self.right), self.minwidth);
            resize_w = self.width !== old_w;
        }

        if(resize_h){

            self.height = self.height//Math.max(Math.min(self.height, self.maxheight, root_h - self.y - self.bottom), self.minheight);
            resize_h = self.height !== old_h;
        }

        if(resize_w || resize_h){

            use_raf ? raf_resize = true : self.resize();
        }

        if(move_x){

            if(self.max){

                self.x = (

                    pageX < root_w / 3 ?

                        self.left
                    :
                        pageX > root_w / 3 * 2 ?

                            root_w - self.width - self.right
                        :
                            root_w / 2 - self.width / 2

                ) + offsetX;
            }

            self.x = self.x//Math.max(Math.min(self.x, self.overflow ? root_w - 30 : root_w - self.width - self.right), self.overflow ? 30 - self.width : self.left);
            move_x = self.x !== old_x;
        }

        if(move_y){

            if(self.max){

                self.y = self.top + offsetY;
            }

            self.y = self.y//Math.max(Math.min(self.y, self.overflow ? root_h - self.header : root_h - self.height - self.bottom), self.top);
            move_y = self.y !== old_y;
        }

        if(move_x || move_y){

            if(self.max){

                self.restore();
            }

            use_raf ? raf_move = true : self.move();
        }

        if(resize_w || move_x){

            x = pageX;
        }

        if(resize_h || move_y){

            y = pageY;
        }
    }

    function handler_mouseup(event){

        preventEvent(event);
        removeClass(body, "wb-lock");
        use_raf && cancelAnimationFrame(raf_timer);

        if(touch){

            //removeListener(self.dom, "touchmove", preventEvent);
            removeListener(window, "touchmove", handler_mousemove, eventOptionsPassive);
            removeListener(window, "touchend", handler_mouseup, eventOptionsPassive);
        }
        else{

            //removeListener(this, "mouseleave", handler_mouseup);
            removeListener(window, "mousemove", handler_mousemove, eventOptionsPassive);
            removeListener(window, "mouseup", handler_mouseup, eventOptionsPassive);
        }
    }
}

function init(){

    // TODO: the window height of iOS isn't determined correctly when the bottom toolbar disappears

    // the bounding rect provides more precise dimensions (float values)
    // //const rect = doc.getBoundingClientRect();
    // this.root_w = doc.clientWidth; //rect.width || (rect.right - rect.left);
    // this.root_h = doc.clientHeight; //rect.height || (rect.top - rect.bottom);

    // if(ios){
    //     this.root_h = window.innerHeight * (this.root_w / window.innerWidth);
    // }

    // root_w = doc.clientWidth;
    // root_h = doc.clientHeight;

    // root_w = body.clientWidth;
    // root_h = body.clientHeight;

    const doc = document.documentElement;
    root_w = doc.clientWidth;
    root_h = doc.clientHeight;
}

/**
 * @param {Element=} src
 * @this WinBox
 */

WinBox.prototype.updatePerspective = function(){
    var width = parseInt(this.dom.style.width.slice(0, -2))
    var height = parseInt(this.dom.style.height.slice(0, -2))
    var perspective = (width + height) / 2
    setStyle(this.dom, "transform", "perspective("+ perspective +"px)");

    var x = parseInt(this.dom.style.left.slice(0, -2))
    var y = parseInt(this.dom.style.top.slice(0, -2))
    var wbReflection = getByClass(this.dom, "wb-reflection")
    //setStyle(wbReflection, "background-position", `${x * 0.67}px ${y * 0.67}px`)

    return this;
};

WinBox.prototype.mount = function(src){

    // handles mounting over:
    this.unmount();

    src._backstore || (src._backstore = src.parentNode);
    this.body.textContent = "";
    this.body.appendChild(src);

    return this;
};

/**
 * @param {Element=} dest
 * @this WinBox
 */

WinBox.prototype.unmount = function(dest){

    const node = this.body.firstChild;

    if(node){

        const root = dest || node._backstore;

        root && root.appendChild(node);
        node._backstore = dest;
    }

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setTitle = function(title){

    const node = getByClass(this.dom, "wb-title");
    setText(node, this.title = title);
    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setIcon = function(src){

    const img = getByClass(this.dom, "wb-icon");
    setStyle(img, "background-image", "url(" + src + ")");
    setStyle(img, "display", "inline-block");
    addClass(img, "visible")

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setBackground = function(background){

    setStyle(this.dom, "background", background);
    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setUrl = function(url, onload){

    const node = this.body.firstChild;

    if(node && (node.tagName.toLowerCase() === "iframe")){

        node.src = url;
    }
    else{

        this.body.innerHTML = '<iframe src="' + url + '"></iframe>';
        onload && (this.body.firstChild.onload = onload);
    }

    return this;
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.focus = function(state){

    if(state === false){

        return this.blur();
    }

    if(!this.focused){

        const stack_length = stack_win.length;

        if(stack_length > 1){

            for(let i = 1; i <= stack_length; i++){

                const last_focus = stack_win[stack_length - i];

                if(last_focus.focused /*&& last_focus !== this*/){

                    last_focus.blur();
                    stack_win.push(stack_win.splice(stack_win.indexOf(this), 1)[0]);

                    break;
                }
            }
        }

        closeStart();

        setStyle(this.dom, "z-index", ++index_counter);
        this.index = index_counter;
        this.addClass("focus");
        this.focused = true;
        this.onfocus && this.onfocus();

        setTimeout(() => {
            const appButton = document.getElementById(`${this.id}_app`);
            appButton.classList.add("focus");
        }, 10);
    }

    return this;
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.blur = function(state){

    if(state === false){

        return this.focus();
    }

    if(this.focused){

        this.removeClass("focus");
        this.focused = false;
        this.onblur && this.onblur();
        setTimeout(() => {
            const appButton = document.getElementById(`${this.id}_app`);
            appButton.classList.remove("focus");
        }, 50);
    }

    return this;
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.hide = function(state){

    if(state === false){

        return this.show();
    }

    if(!this.hidden){

        this.onhide && this.onhide();
        this.hidden = true;
        return this.addClass("hide");
    }
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.show = function(state){

    if(state === false){

        return this.hide();
    }

    if(this.hidden){

        this.onshow && this.onshow();
        this.hidden = false;
        return this.removeClass("hide");
    }
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.minimize = function(state){

    this.updatePerspective();

    if(state === false){

        return this.restore();
    }

    if(is_fullscreen){

        cancel_fullscreen();
    }

    if(this.max){

        this.removeClass("max");
        this.max = false;
    }

    if(!this.min){

        stack_min.push(this);
        update_min_stack();
        this.dom.title = this.title;
        this.addClass("min");
        this.min = true;

        if(this.focused){

            this.blur();
            focus_next();
        }

        this.onminimize && this.onminimize();
    }

    return this;
};

function focus_next(){

    const stack_length = stack_win.length;

    if(stack_length){

        for(let i = stack_length - 1; i >= 0; i--){

            const last_focus = stack_win[i];

            if(!last_focus.min /*&& last_focus !== this*/){

                last_focus.focus();
                break;
            }
        }
    }
}

/**
 * @this WinBox
 */

WinBox.prototype.restore = function(){

    this.updatePerspective();

    if(is_fullscreen){

        cancel_fullscreen();
    }

    if(this.min){

        remove_min_stack(this);
        this.resize().move();
        this.onrestore && this.onrestore();
    }

    if(this.max){

        this.max = false;
        this.removeClass("max").resize().move();
        this.onrestore && this.onrestore();
    }

    return this;
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.maximize = function(state){

    if(state === false){

        return this.restore();
    }

    if(is_fullscreen){

        cancel_fullscreen();
    }

    if(this.min){

        remove_min_stack(this);
    }

    if(!this.max){

        var taskbar = getByClass(document.body, "taskbar");

        if (hasClass(taskbar, "small")){
            this.addClass("max").resize(

                root_w - this.left - this.right,
                root_h - this.top - this.bottom - 30,
                true

            ).move(

                this.left,
                this.top,
                true
            );
        } else {
            this.addClass("max").resize(

                root_w - this.left - this.right,
                root_h - this.top - this.bottom - 40,
                true

            ).move(

                this.left,
                this.top,
                true
            );
        }

        this.max = true;
        this.onmaximize && this.onmaximize();
    }

    this.updatePerspective();

    return this;
};

/**
 * @param {boolean=} state
 * @this WinBox
 */

WinBox.prototype.fullscreen = function(state){

    if(this.min){

        remove_min_stack(this);
        this.resize().move();
    }

    // fullscreen could be changed by user manually!

    if(!is_fullscreen || !cancel_fullscreen()){

        // requestFullscreen is executed as async and returns promise.
        // in this case it is better to set the state to "this.full" after the requestFullscreen was fired,
        // because it may break when browser does not support fullscreen properly and bypass it silently.

        this.body[prefix_request]();
        is_fullscreen = this;
        this.full = true;
        this.onfullscreen && this.onfullscreen();
    }
    else if(state === false){

        return this.restore();
    }

    return this;
};

function has_fullscreen(){

    return (

        document["fullscreen"] ||
        document["fullscreenElement"] ||
        document["webkitFullscreenElement"] ||
        document["mozFullScreenElement"]
    );
}

/**
 * @return {boolean|void}
 */

function cancel_fullscreen(){

    is_fullscreen.full = false;

    if(has_fullscreen()){

        // exitFullscreen is executed as async and returns promise.
        // the important part is that the promise callback runs before the event "onresize" was fired!

        document[prefix_exit]();
        return true;
    }
}

/**
 * @param {boolean=} force
 * @this WinBox
 */

WinBox.prototype.close = function(force) {

    this.updatePerspective();

    if(this.onclose && this.onclose(force)){

        return true;
    }

    if(this.min){

        remove_min_stack(this);
    }

    stack_win.splice(stack_win.indexOf(this), 1);

    addClass(this.dom, "close")

    document.getElementById(`${this.id}_app`).remove()

    var time = 275

    if (hasClass(this.dom, "no-anim"))
    {
        time = 0
    }

    setTimeout(() => {
        this.unmount();
        this.dom.remove();
        this.dom.textContent = "";
        this.dom["winbox"] = null;
        this.body = null;
        this.dom = null;
        this.focused && focus_next();
    }, time);
};

/**
 * @param {number|string=} x
 * @param {number|string=} y
 * @param {boolean=} _skip_update
 * @this WinBox
 */

WinBox.prototype.move = function(x, y, _skip_update){

    this.updatePerspective();

    //if (hasClass(this.dom, "frozen")){

        if(!x && (x !== 0)){

            x = this.x;
            y = this.y;
        }
        else if(!_skip_update){

            this.x = x ? x = parse(x, root_w - this.left - this.right, this.width) : 0;
            this.y = y ? y = parse(y, root_h - this.top - this.bottom, this.height) : 0;
        }

        //setStyle(this.dom, "transform", "translate(" + x + "px," + y + "px)");
        setStyle(this.dom, "left", x + "px");
        setStyle(this.dom, "top", y + "px");

        this.onmove && this.onmove(x, y);
    //}
    return this;
};

/**
 * @param {number|string=} w
 * @param {number|string=} h
 * @param {boolean=} _skip_update
 * @this WinBox
 */

WinBox.prototype.resize = function(w, h, _skip_update){

    this.updatePerspective();

    if(!w && (w !== 0)){

        w = this.width;
        h = this.height;
    }
    else if(!_skip_update){

        this.width = w ? w = parse(w, this.maxwidth /*- this.left - this.right*/) : 0;
        this.height = h ? h = parse(h, this.maxheight /*- this.top - this.bottom*/) : 0;

        w = Math.max(w, this.minwidth);
        h = Math.max(h, this.minheight);
    }

    setStyle(this.dom, "width", w + "px");
    setStyle(this.dom, "height", h + "px");

    this.onresize && this.onresize(w, h);
    return this;
};

/**
 * @param {{ class:string?, image:string?, click:Function?, index:number? }} control
 * @this WinBox
 */

WinBox.prototype.addControl = function(control){

    const classname = control["class"];
    const image = control.image;
    const click = control.click;
    const index = control.index;
    const node = document.createElement("span");
    const icons = getByClass(this.dom, "wb-control");
    const self = this;

    if(classname) node.className = classname;
    if(image) setStyle(node, "background-image", "url(" + image + ")");
    if(click) node.onclick = function(event){ click.call(this, event, self) };

    icons.insertBefore(node, icons.childNodes[index || 0]);

    return this;
};

/**
 * @param {string} control
 * @this WinBox
 */

WinBox.prototype.removeControl = function(control){

    control = getByClass(this.dom, control);
    control && control.remove();
    return this;
};

/**
 * @param {string} classname
 * @this WinBox
 */

WinBox.prototype.addClass = function(classname){

    addClass(this.dom, classname);
    return this;
};

/**
 * @param {string} classname
 * @this WinBox
 */

WinBox.prototype.removeClass = function(classname){

    removeClass(this.dom, classname);
    return this;
};


/**
 * @param {string} classname
 * @this WinBox
 */

WinBox.prototype.hasClass = function(classname){

    return hasClass(this.dom, classname);
};

/**
 * @param {string} classname
 * @this WinBox
 */

WinBox.prototype.toggleClass = function(classname){

    return this.hasClass(classname) ? this.removeClass(classname) : this.addClass(classname);
};

/*
WinBox.prototype.use = function(plugin){

    this.plugins.push(plugin);
    return this;
};
*/