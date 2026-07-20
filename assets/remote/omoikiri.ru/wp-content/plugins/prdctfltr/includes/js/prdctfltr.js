/**
 * Selectize (v0.15.2)
 * https://selectize.dev
 *
 * Copyright (c) 2013-2015 Brian Reavis & contributors
 * Copyright (c) 2020-2023 Selectize Team & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 * @author Ris Adams <selectize@risadams.com>
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    root.Selectize = factory(root.jQuery);
  }
}(this, function ($) {
  'use strict';
  var highlight=function(t,e){var r,a;if("string"!=typeof e||e.length)return r="string"==typeof e?new RegExp(e,"i"):e,a=function(t){var e=0;if(3===t.nodeType){var n,i,o=t.data.search(r);0<=o&&0<t.data.length&&(i=t.data.match(r),(n=document.createElement("span")).className="highlight",(o=t.splitText(o)).splitText(i[0].length),i=o.cloneNode(!0),n.appendChild(i),o.parentNode.replaceChild(n,o),e=1)}else if(1===t.nodeType&&t.childNodes&&!/(script|style)/i.test(t.tagName)&&("highlight"!==t.className||"SPAN"!==t.tagName))for(var s=0;s<t.childNodes.length;++s)s+=a(t.childNodes[s]);return e},t.each(function(){a(this)})},MicroEvent=($.fn.removeHighlight=function(){return this.find("span.highlight").each(function(){this.parentNode.firstChild.nodeName;var t=this.parentNode;t.replaceChild(this.firstChild,this),t.normalize()}).end()},function(){}),MicroPlugin=(MicroEvent.prototype={on:function(t,e){this._events=this._events||{},this._events[t]=this._events[t]||[],this._events[t].push(e)},off:function(t,e){var n=arguments.length;return 0===n?delete this._events:1===n?delete this._events[t]:(this._events=this._events||{},void(t in this._events!=!1&&this._events[t].splice(this._events[t].indexOf(e),1)))},trigger:function(t){var e=this._events=this._events||{};if(t in e!=!1)for(var n=0;n<e[t].length;n++)e[t][n].apply(this,Array.prototype.slice.call(arguments,1))}},MicroEvent.mixin=function(t){for(var e=["on","off","trigger"],n=0;n<e.length;n++)t.prototype[e[n]]=MicroEvent.prototype[e[n]]},{});MicroPlugin.mixin=function(o){o.plugins={},o.prototype.initializePlugins=function(t){var e,n,i,o=this,s=[];if(o.plugins={names:[],settings:{},requested:{},loaded:{}},isArray(t))for(e=0,n=t.length;e<n;e++)"string"==typeof t[e]?s.push(t[e]):(o.plugins.settings[t[e].name]=t[e].options,s.push(t[e].name));else if(t)for(i in t)t.hasOwnProperty(i)&&(o.plugins.settings[i]=t[i],s.push(i));for(;s.length;)o.require(s.shift())},o.prototype.loadPlugin=function(t){var e=this,n=e.plugins,i=o.plugins[t];if(!o.plugins.hasOwnProperty(t))throw new Error('Unable to find "'+t+'" plugin');n.requested[t]=!0,n.loaded[t]=i.fn.apply(e,[e.plugins.settings[t]||{}]),n.names.push(t)},o.prototype.require=function(t){var e=this,n=e.plugins;if(!e.plugins.loaded.hasOwnProperty(t)){if(n.requested[t])throw new Error('Plugin has circular dependency ("'+t+'")');e.loadPlugin(t)}return n.loaded[t]},o.define=function(t,e){o.plugins[t]={name:t,fn:e}}};const nanoid=(t=21)=>crypto.getRandomValues(new Uint8Array(t)).reduce((t,e)=>t+((e&=63)<36?e.toString(36):e<62?(e-26).toString(36).toUpperCase():62<e?"-":"_"),"");var Sifter=function(t,e){this.items=t,this.settings=e||{diacritics:!0}},cmp=(Sifter.prototype.tokenize=function(t,e){if(!(t=trim(String(t||"").toLowerCase()))||!t.length)return[];for(var n,i,o=[],s=t.split(/ +/),r=0,a=s.length;r<a;r++){if(n=escape_regex(s[r]),this.settings.diacritics)for(i in DIACRITICS)DIACRITICS.hasOwnProperty(i)&&(n=n.replace(new RegExp(i,"g"),DIACRITICS[i]));e&&(n="\\b"+n),o.push({string:s[r],regex:new RegExp(n,"i")})}return o},Sifter.prototype.iterator=function(t,e){var n=is_array(t)?Array.prototype.forEach||function(t){for(var e=0,n=this.length;e<n;e++)t(this[e],e,this)}:function(t){for(var e in this)this.hasOwnProperty(e)&&t(this[e],e,this)};n.apply(t,[e])},Sifter.prototype.getScoreFunction=function(t,e){function o(t,e){var n;return!t||-1===(n=(t=String(t||"")).search(e.regex))?0:(e=e.string.length/t.length,0===n&&(e+=.5),e)}var s,r=(t=this.prepareSearch(t,e)).tokens,a=t.options.fields,l=r.length,p=t.options.nesting,c=(s=a.length)?1===s?function(t,e){return o(getattr(e,a[0],p),t)}:function(t,e){for(var n=0,i=0;n<s;n++)i+=o(getattr(e,a[n],p),t);return i/s}:function(){return 0};return l?1===l?function(t){return c(r[0],t)}:"and"===t.options.conjunction?function(t){for(var e,n=0,i=0;n<l;n++){if((e=c(r[n],t))<=0)return 0;i+=e}return i/l}:function(t){for(var e=0,n=0;e<l;e++)n+=c(r[e],t);return n/l}:function(){return 0}},Sifter.prototype.getSortFunction=function(t,n){var e,i,o,s,r,a,l,p=this,c=!(t=p.prepareSearch(t,n)).query&&n.sort_empty||n.sort,d=function(t,e){return"$score"===t?e.score:getattr(p.items[e.id],t,n.nesting)},u=[];if(c)for(e=0,i=c.length;e<i;e++)!t.query&&"$score"===c[e].field||u.push(c[e]);if(t.query){for(l=!0,e=0,i=u.length;e<i;e++)if("$score"===u[e].field){l=!1;break}l&&u.unshift({field:"$score",direction:"desc"})}else for(e=0,i=u.length;e<i;e++)if("$score"===u[e].field){u.splice(e,1);break}for(a=[],e=0,i=u.length;e<i;e++)a.push("desc"===u[e].direction?-1:1);return(s=u.length)?1===s?(o=u[0].field,r=a[0],function(t,e){return r*cmp(d(o,t),d(o,e))}):function(t,e){for(var n,i=0;i<s;i++)if(n=u[i].field,n=a[i]*cmp(d(n,t),d(n,e)))return n;return 0}:null},Sifter.prototype.prepareSearch=function(t,e){var n,i,o;return"object"==typeof t?t:(n=(e=extend({},e)).fields,i=e.sort,o=e.sort_empty,n&&!is_array(n)&&(e.fields=[n]),i&&!is_array(i)&&(e.sort=[i]),o&&!is_array(o)&&(e.sort_empty=[o]),{options:e,query:String(t||"").toLowerCase(),tokens:this.tokenize(t,e.respect_word_boundaries),total:0,items:[]})},Sifter.prototype.search=function(t,n){var i,o,e=this,s=this.prepareSearch(t,n);return n=s.options,t=s.query,o=n.score||e.getScoreFunction(s),t.length?e.iterator(e.items,function(t,e){i=o(t),(!1===n.filter||0<i)&&s.items.push({score:i,id:e})}):e.iterator(e.items,function(t,e){s.items.push({score:1,id:e})}),(t=e.getSortFunction(s,n))&&s.items.sort(t),s.total=s.items.length,"number"==typeof n.limit&&(s.items=s.items.slice(0,n.limit)),s},function(t,e){return"number"==typeof t&&"number"==typeof e?e<t?1:t<e?-1:0:(t=asciifold(String(t||"")),(e=asciifold(String(e||"")))<t?1:t<e?-1:0)}),extend=function(t,e){for(var n,i,o=1,s=arguments.length;o<s;o++)if(i=arguments[o])for(n in i)i.hasOwnProperty(n)&&(t[n]=i[n]);return t},getattr=function(t,e,n){if(t&&e){if(!n)return t[e];for(var i=e.split(".");i.length&&(t=t[i.shift()]););return t}},trim=function(t){return(t+"").replace(/^\s+|\s+$|/g,"")},escape_regex=function(t){return(t+"").replace(/([.?*+^$[\]\\(){}|-])/g,"\\$1")},is_array=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)},DIACRITICS={a:"[aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ]",b:"[b␢βΒB฿𐌁ᛒ]",c:"[cĆćĈĉČčĊċC̄c̄ÇçḈḉȻȼƇƈɕᴄＣｃ]",d:"[dĎďḊḋḐḑḌḍḒḓḎḏĐđD̦d̦ƉɖƊɗƋƌᵭᶁᶑȡᴅＤｄð]",e:"[eÉéÈèÊêḘḙĚěĔĕẼẽḚḛẺẻĖėËëĒēȨȩĘęᶒɆɇȄȅẾếỀềỄễỂểḜḝḖḗḔḕȆȇẸẹỆệⱸᴇＥｅɘǝƏƐε]",f:"[fƑƒḞḟ]",g:"[gɢ₲ǤǥĜĝĞğĢģƓɠĠġ]",h:"[hĤĥĦħḨḩẖẖḤḥḢḣɦʰǶƕ]",i:"[iÍíÌìĬĭÎîǏǐÏïḮḯĨĩĮįĪīỈỉȈȉȊȋỊịḬḭƗɨɨ̆ᵻᶖİiIıɪＩｉ]",j:"[jȷĴĵɈɉʝɟʲ]",k:"[kƘƙꝀꝁḰḱǨǩḲḳḴḵκϰ₭]",l:"[lŁłĽľĻļĹĺḶḷḸḹḼḽḺḻĿŀȽƚⱠⱡⱢɫɬᶅɭȴʟＬｌ]",n:"[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲȠƞᵰᶇɳȵɴＮｎŊŋ]",o:"[oØøÖöÓóÒòÔôǑǒŐőŎŏȮȯỌọƟɵƠơỎỏŌōÕõǪǫȌȍՕօ]",p:"[pṔṕṖṗⱣᵽƤƥᵱ]",q:"[qꝖꝗʠɊɋꝘꝙq̃]",r:"[rŔŕɌɍŘřŖŗṘṙȐȑȒȓṚṛⱤɽ]",s:"[sŚśṠṡṢṣꞨꞩŜŝŠšŞşȘșS̈s̈]",t:"[tŤťṪṫŢţṬṭƮʈȚțṰṱṮṯƬƭ]",u:"[uŬŭɄʉỤụÜüÚúÙùÛûǓǔŰűŬŭƯưỦủŪūŨũŲųȔȕ∪]",v:"[vṼṽṾṿƲʋꝞꝟⱱʋ]",w:"[wẂẃẀẁŴŵẄẅẆẇẈẉ]",x:"[xẌẍẊẋχ]",y:"[yÝýỲỳŶŷŸÿỸỹẎẏỴỵɎɏƳƴ]",z:"[zŹźẐẑŽžŻżẒẓẔẕƵƶ]"},asciifold=function(){var t,e,n,i,o="",s={};for(n in DIACRITICS)if(DIACRITICS.hasOwnProperty(n))for(o+=i=DIACRITICS[n].substring(2,DIACRITICS[n].length-1),t=0,e=i.length;t<e;t++)s[i.charAt(t)]=n;var r=new RegExp("["+o+"]","g");return function(t){return t.replace(r,function(t){return s[t]}).toLowerCase()}}(),IS_MAC=uaDetect("macOS",/Mac/),KEY_A=65,KEY_COMMA=188,KEY_RETURN=13,KEY_ESC=27,KEY_LEFT=37,KEY_UP=38,KEY_P=80,KEY_RIGHT=39,KEY_DOWN=40,KEY_N=78,KEY_BACKSPACE=8,KEY_DELETE=46,KEY_SHIFT=16,KEY_CMD=IS_MAC?91:17,KEY_CTRL=IS_MAC?18:17,KEY_TAB=9,TAG_SELECT=1,TAG_INPUT=2,SUPPORTS_VALIDITY_API=!uaDetect("Android",/android/i)&&!!document.createElement("input").validity,isset=function(t){return void 0!==t},isArray=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)},hash_key=function(t){return null==t?null:"boolean"==typeof t?t?"1":"0":t+""},escape_html=function(t){return(t+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")},escape_replace=function(t){return(t+"").replace(/\$/g,"$$$$")},hook={before:function(t,e,n){var i=t[e];t[e]=function(){return n.apply(t,arguments),i.apply(t,arguments)}},after:function(e,t,n){var i=e[t];e[t]=function(){var t=i.apply(e,arguments);return n.apply(e,arguments),t}}},once=function(t){var e=!1;return function(){e||(e=!0,t.apply(this,arguments))}},debounce=function(n,i){var o;return function(){var t=this,e=arguments;window.clearTimeout(o),o=window.setTimeout(function(){n.apply(t,e)},i)}},debounce_events=function(e,n,t){var i,o=e.trigger,s={};for(i in e.trigger=function(){var t=arguments[0];if(-1===n.indexOf(t))return o.apply(e,arguments);s[t]=arguments},t.apply(e,[]),e.trigger=o,s)s.hasOwnProperty(i)&&o.apply(e,s[i])},watchChildEvent=function(n,t,e,i){n.on(t,e,function(t){for(var e=t.target;e&&e.parentNode!==n[0];)e=e.parentNode;return t.currentTarget=e,i.apply(this,[t])})},getInputSelection=function(t){var e,n,i={};return void 0===t?console.warn("WARN getInputSelection cannot locate input control"):"selectionStart"in t?(i.start=t.selectionStart,i.length=t.selectionEnd-i.start):document.selection&&(t.focus(),e=document.selection.createRange(),n=document.selection.createRange().text.length,e.moveStart("character",-t.value.length),i.start=e.text.length-n,i.length=n),i},transferStyles=function(t,e,n){var i,o,s={};if(n)for(i=0,o=n.length;i<o;i++)s[n[i]]=t.css(n[i]);else s=t.css();e.css(s)},measureString=function(t,e){return t?(Selectize.$testInput||(Selectize.$testInput=$("<span />").css({position:"absolute",width:"auto",padding:0,whiteSpace:"pre"}),$("<div />").css({position:"absolute",width:0,height:0,overflow:"hidden"}).attr({"aria-hidden":!0}).append(Selectize.$testInput).appendTo("body")),Selectize.$testInput.text(t),transferStyles(e,Selectize.$testInput,["letterSpacing","fontSize","fontFamily","fontWeight","textTransform"]),Selectize.$testInput.width()):0},autoGrow=function(s){function t(t,e){var n,i,o;e=e||{},(t=t||window.event||{}).metaKey||t.altKey||!e.force&&!1===s.data("grow")||(e=s.val(),t.type&&"keydown"===t.type.toLowerCase()&&(i=48<=(o=t.keyCode)&&o<=57||65<=o&&o<=90||96<=o&&o<=111||186<=o&&o<=222||32===o,o===KEY_DELETE||o===KEY_BACKSPACE?(n=getInputSelection(s[0])).length?e=e.substring(0,n.start)+e.substring(n.start+n.length):o===KEY_BACKSPACE&&n.start?e=e.substring(0,n.start-1)+e.substring(n.start+1):o===KEY_DELETE&&void 0!==n.start&&(e=e.substring(0,n.start)+e.substring(n.start+1)):i&&(o=t.shiftKey,n=String.fromCharCode(t.keyCode),e+=n=o?n.toUpperCase():n.toLowerCase())),i=s.attr("readonly")?0:4,o=(t=s.attr("placeholder"))?measureString(t,s)+i:0,(i=Math.max(measureString(e,s),o)+i)===r)||(r=i,s.width(i),s.triggerHandler("resize"))}var r=null;s.on("keydown keyup update blur",t),t()},domToString=function(t){var e=document.createElement("div");return e.appendChild(t.cloneNode(!0)),e.innerHTML},logError=function(t,e){e=e||{};console.error("Selectize: "+t),e.explanation&&(console.group&&console.group(),console.error(e.explanation),console.group)&&console.groupEnd()},isJSON=function(t){try{JSON.parse(t)}catch(t){return!1}return!0};function uaDetect(t,e){return navigator.userAgentData?t===navigator.userAgentData.platform:e.test(navigator.userAgent)}var Selectize=function(t,e){var n,i,o=this,s=t[0],r=(s.selectize=o,window.getComputedStyle&&window.getComputedStyle(s,null));if(r=(r?r.getPropertyValue("direction"):s.currentStyle&&s.currentStyle.direction)||t.parents("[dir]:first").attr("dir")||"",o.settings={},$.extend(o,{order:0,settings:e,$input:t,tabIndex:t.attr("tabindex")||"",tagType:"select"===s.tagName.toLowerCase()?TAG_SELECT:TAG_INPUT,rtl:/rtl/i.test(r),eventNS:".selectize"+ ++Selectize.count,highlightedValue:null,isBlurring:!1,isOpen:!1,isDisabled:!1,isRequired:t.is("[required]"),isInvalid:!1,isLocked:!1,isFocused:!1,isInputHidden:!1,isSetup:!1,isShiftDown:!1,isCmdDown:!1,isCtrlDown:!1,ignoreFocus:!1,ignoreBlur:!1,ignoreHover:!1,hasOptions:!1,currentResults:null,lastValue:"",lastValidValue:"",lastOpenTarget:!1,caretPos:0,loading:0,loadedSearches:{},isDropdownClosing:!1,$activeOption:null,$activeItems:[],optgroups:{},options:{},userOptions:{},items:[],renderCache:{},onSearchChange:null===e.loadThrottle?o.onSearchChange:debounce(o.onSearchChange,e.loadThrottle)}),o.sifter=new Sifter(this.options,{diacritics:e.diacritics}),o.settings.options){for(n=0,i=o.settings.options.length;n<i;n++)o.registerOption(o.settings.options[n]);delete o.settings.options}if(o.settings.optgroups){for(n=0,i=o.settings.optgroups.length;n<i;n++)o.registerOptionGroup(o.settings.optgroups[n]);delete o.settings.optgroups}o.settings.mode=o.settings.mode||(1===o.settings.maxItems?"single":"multi"),"boolean"!=typeof o.settings.hideSelected&&(o.settings.hideSelected="multi"===o.settings.mode),o.initializePlugins(o.settings.plugins),o.setupCallbacks(),o.setupTemplates(),o.setup()};MicroEvent.mixin(Selectize),MicroPlugin.mixin(Selectize),$.extend(Selectize.prototype,{setup:function(){var e=this,t=e.settings,n=e.eventNS,i=$(window),o=$(document),s=e.$input,r=e.settings.mode,a=s.attr("class")||"",l=t.showArrow?"":" no-arrow",p=$("<div>").addClass(t.wrapperClass).addClass(a+" selectize-control").addClass(r),l=$("<div>").addClass(t.inputClass+l+" selectize-input items").appendTo(p),c=$('<input type="text" autocomplete="new-password" autofill="no" />').appendTo(l).attr("tabindex",s.is(":disabled")?"-1":e.tabIndex),d=$(t.dropdownParent||p),r=$("<div>").addClass(t.dropdownClass).addClass(r+" selectize-dropdown").hide().appendTo(d),d=$("<div>").addClass(t.dropdownContentClass+" selectize-dropdown-content").attr("tabindex","-1").appendTo(r),u=((u=s.attr("id"))&&(c.attr("id",u+"-selectized"),$("label[for='"+u+"']").attr("for",u+"-selectized")),e.settings.copyClassesToDropdown&&r.addClass(a),p.css({width:s[0].style.width}),e.plugins.names.length&&(u="plugin-"+e.plugins.names.join(" plugin-"),p.addClass(u),r.addClass(u)),(null===t.maxItems||1<t.maxItems)&&e.tagType===TAG_SELECT&&s.attr("multiple","multiple"),e.settings.placeholder&&c.attr("placeholder",t.placeholder),e.settings.search||(c.attr("readonly",!0),c.attr("inputmode","none"),l.css("cursor","pointer")),!e.settings.splitOn&&e.settings.delimiter&&(a=e.settings.delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),e.settings.splitOn=new RegExp("\\s*"+a+"+\\s*")),s.attr("autocorrect")&&c.attr("autocorrect",s.attr("autocorrect")),s.attr("autocapitalize")&&c.attr("autocapitalize",s.attr("autocapitalize")),s.is("input")&&(c[0].type=s[0].type),e.$wrapper=p,e.$control=l,e.$control_input=c,e.$dropdown=r,e.$dropdown_content=d,r.on("mouseenter mousedown mouseup click","[data-disabled]>[data-selectable]",function(t){t.stopImmediatePropagation()}),r.on("mouseenter","[data-selectable]",function(){return e.onOptionHover.apply(e,arguments)}),r.on("mouseup click","[data-selectable]",function(){return e.onOptionSelect.apply(e,arguments)}),watchChildEvent(l,"mouseup","*:not(input)",function(){return e.onItemSelect.apply(e,arguments)}),autoGrow(c),l.on({mousedown:function(){return e.onMouseDown.apply(e,arguments)},click:function(){return e.onClick.apply(e,arguments)}}),c.on({mousedown:function(t){""===e.$control_input.val()&&!e.settings.openOnFocus||t.stopPropagation()},keydown:function(){return e.onKeyDown.apply(e,arguments)},keypress:function(){return e.onKeyPress.apply(e,arguments)},input:function(){return e.onInput.apply(e,arguments)},resize:function(){e.positionDropdown.apply(e,[])},blur:function(){return e.onBlur.apply(e,arguments)},focus:function(){return e.onFocus.apply(e,arguments)},paste:function(){return e.onPaste.apply(e,arguments)}}),o.on("keydown"+n,function(t){e.isCmdDown=t[IS_MAC?"metaKey":"ctrlKey"],e.isCtrlDown=t[IS_MAC?"altKey":"ctrlKey"],e.isShiftDown=t.shiftKey}),o.on("keyup"+n,function(t){t.keyCode===KEY_CTRL&&(e.isCtrlDown=!1),t.keyCode===KEY_SHIFT&&(e.isShiftDown=!1),t.keyCode===KEY_CMD&&(e.isCmdDown=!1)}),o.on("mousedown"+n,function(t){if(e.isFocused){if(t.target===e.$dropdown[0]||e.$dropdown.has(t.target).length)return!1;t.target!==e.$control[0]&&e.blur(t.target)}}),i.on(["scroll"+n,"resize"+n].join(" "),function(){e.isOpen&&e.positionDropdown.apply(e,arguments)}),i.on("mousemove"+n,function(){e.ignoreHover=e.settings.ignoreHover}),$("<div></div>")),a=s.children().detach();s.replaceWith(u),u.replaceWith(s),this.revertSettings={$children:a,tabindex:s.attr("tabindex")},s.attr("tabindex",-1).hide().after(e.$wrapper),Array.isArray(t.items)&&(e.lastValidValue=t.items,e.setValue(t.items),delete t.items),SUPPORTS_VALIDITY_API&&s.on("invalid"+n,function(t){t.preventDefault(),e.isInvalid=!0,e.refreshState()}),e.updateOriginalInput(),e.refreshItems(),e.refreshState(),e.updatePlaceholder(),e.isSetup=!0,s.is(":disabled")&&e.disable(),e.on("change",this.onChange),s.data("selectize",e),s.addClass("selectized"),e.trigger("initialize"),!0===t.preload&&e.onSearchChange("")},setupTemplates:function(){var t=this,i=t.settings.labelField,o=t.settings.valueField,n=t.settings.optgroupLabelField;t.settings.render=$.extend({},{optgroup:function(t){return'<div class="optgroup">'+t.html+"</div>"},optgroup_header:function(t,e){return'<div class="optgroup-header">'+e(t[n])+"</div>"},option:function(t,e){var n=t.classes?" "+t.classes:"";return n+=""===t[o]?" selectize-dropdown-emptyoptionlabel":"","<div"+(t.styles?' style="'+t.styles+'"':"")+' class="option'+n+'">'+e(t[i])+"</div>"},item:function(t,e){return'<div class="item">'+e(t[i])+"</div>"},option_create:function(t,e){return'<div class="create">Add <strong>'+e(t.input)+"</strong>&#x2026;</div>"}},t.settings.render)},setupCallbacks:function(){var t,e,n={initialize:"onInitialize",change:"onChange",item_add:"onItemAdd",item_remove:"onItemRemove",clear:"onClear",option_add:"onOptionAdd",option_remove:"onOptionRemove",option_clear:"onOptionClear",optgroup_add:"onOptionGroupAdd",optgroup_remove:"onOptionGroupRemove",optgroup_clear:"onOptionGroupClear",dropdown_open:"onDropdownOpen",dropdown_close:"onDropdownClose",type:"onType",load:"onLoad",focus:"onFocus",blur:"onBlur",dropdown_item_activate:"onDropdownItemActivate",dropdown_item_deactivate:"onDropdownItemDeactivate"};for(t in n)n.hasOwnProperty(t)&&(e=this.settings[n[t]])&&this.on(t,e)},onClick:function(t){this.isDropdownClosing||this.isFocused&&this.isOpen||(this.focus(),t.preventDefault())},onMouseDown:function(t){var e=this,n=t.isDefaultPrevented(),t=$(t.target);if(e.isFocused||n||window.setTimeout(function(){e.isOpen||e.focus()},0),t!==e.$control_input[0]||""===e.$control_input.val())return"single"===e.settings.mode?e.isOpen?e.close():e.open():(n||e.setActiveItem(null),e.settings.openOnFocus||(e.isOpen&&t===e.lastOpenTarget?(e.close(),e.lastOpenTarget=!1):(e.isOpen||(e.refreshOptions(),e.open()),e.lastOpenTarget=t))),!1},onChange:function(){""!==this.getValue()&&(this.lastValidValue=this.getValue()),this.$input.trigger("input"),this.$input.trigger("change")},onPaste:function(t){var o=this;o.isFull()||o.isInputHidden||o.isLocked?t.preventDefault():o.settings.splitOn&&setTimeout(function(){var t=o.$control_input.val();if(t.match(o.settings.splitOn))for(var e=t.trim().split(o.settings.splitOn),n=0,i=e.length;n<i;n++)o.createItem(e[n])},0)},onKeyPress:function(t){var e;return this.isLocked?t&&t.preventDefault():(e=String.fromCharCode(t.keyCode||t.which),this.settings.create&&"multi"===this.settings.mode&&e===this.settings.delimiter?(this.createItem(),t.preventDefault(),!1):void 0)},onKeyDown:function(t){t.target,this.$control_input[0];var e,n=this;if(n.isLocked)t.keyCode!==KEY_TAB&&t.preventDefault();else{switch(t.keyCode){case KEY_A:if(n.isCmdDown)return void n.selectAll();break;case KEY_ESC:return void(n.isOpen&&(t.preventDefault(),t.stopPropagation(),n.close()));case KEY_N:if(!t.ctrlKey||t.altKey)break;case KEY_DOWN:return!n.isOpen&&n.hasOptions?n.open():n.$activeOption&&(n.ignoreHover=!0,(e=n.getAdjacentOption(n.$activeOption,1)).length)&&n.setActiveOption(e,!0,!0),void t.preventDefault();case KEY_P:if(!t.ctrlKey||t.altKey)break;case KEY_UP:return n.$activeOption&&(n.ignoreHover=!0,(e=n.getAdjacentOption(n.$activeOption,-1)).length)&&n.setActiveOption(e,!0,!0),void t.preventDefault();case KEY_RETURN:return void(n.isOpen&&n.$activeOption&&(n.onOptionSelect({currentTarget:n.$activeOption}),t.preventDefault()));case KEY_LEFT:return void n.advanceSelection(-1,t);case KEY_RIGHT:return void n.advanceSelection(1,t);case KEY_TAB:return n.settings.selectOnTab&&n.isOpen&&n.$activeOption&&(n.onOptionSelect({currentTarget:n.$activeOption}),n.isFull()||t.preventDefault()),void(n.settings.create&&n.createItem()&&n.settings.showAddOptionOnCreate&&t.preventDefault());case KEY_BACKSPACE:case KEY_DELETE:return void n.deleteSelection(t)}!n.isFull()&&!n.isInputHidden||(IS_MAC?t.metaKey:t.ctrlKey)||t.preventDefault()}},onInput:function(t){var e=this,n=e.$control_input.val()||"";e.lastValue!==n&&(e.lastValue=n,e.onSearchChange(n),e.refreshOptions(),e.trigger("type",n))},onSearchChange:function(e){var n=this,i=n.settings.load;i&&!n.loadedSearches.hasOwnProperty(e)&&(n.loadedSearches[e]=!0,n.load(function(t){i.apply(n,[e,t])}))},onFocus:function(t){var e=this,n=e.isFocused;if(e.isDisabled)return e.blur(),t&&t.preventDefault(),!1;e.ignoreFocus||(e.isFocused=!0,"focus"===e.settings.preload&&e.onSearchChange(""),n||e.trigger("focus"),e.$activeItems.length||(e.showInput(),e.setActiveItem(null),e.refreshOptions(!!e.settings.openOnFocus)),e.refreshState())},onBlur:function(t,e){var n,i=this;i.isFocused&&(i.isFocused=!1,i.ignoreFocus||(n=function(){i.close(),i.setTextboxValue(""),i.setActiveItem(null),i.setActiveOption(null),i.setCaret(i.items.length),i.refreshState(),e&&e.focus&&e.focus(),i.isBlurring=!1,i.ignoreFocus=!1,i.trigger("blur")},i.isBlurring=!0,i.ignoreFocus=!0,i.settings.create&&i.settings.createOnBlur?i.createItem(null,!1,n):n()))},onOptionHover:function(t){this.ignoreHover||this.setActiveOption(t.currentTarget,!1)},onOptionSelect:function(t){var e,n=this;t.preventDefault&&(t.preventDefault(),t.stopPropagation()),(e=$(t.currentTarget)).hasClass("create")?n.createItem(null,function(){n.settings.closeAfterSelect&&n.close()}):void 0!==(e=e.attr("data-value"))&&(n.lastQuery=null,n.setTextboxValue(""),n.addItem(e),n.settings.closeAfterSelect?n.close():!n.settings.hideSelected&&t.type&&/mouse/.test(t.type)&&n.setActiveOption(n.getOption(e)))},onItemSelect:function(t){this.isLocked||"multi"===this.settings.mode&&(t.preventDefault(),this.setActiveItem(t.currentTarget,t))},load:function(t){var e=this,n=e.$wrapper.addClass(e.settings.loadingClass);e.loading++,t.apply(e,[function(t){e.loading=Math.max(e.loading-1,0),t&&t.length&&(e.addOption(t),e.refreshOptions(e.isFocused&&!e.isInputHidden)),e.loading||n.removeClass(e.settings.loadingClass),e.trigger("load",t)}])},getTextboxValue:function(){return this.$control_input.val()},setTextboxValue:function(t){var e=this.$control_input;e.val()!==t&&(e.val(t).triggerHandler("update"),this.lastValue=t)},getValue:function(){return this.tagType===TAG_SELECT&&this.$input.attr("multiple")?this.items:this.items.join(this.settings.delimiter)},setValue:function(t,e){(Array.isArray(t)?t:[t]).join("")!==this.items.join("")&&debounce_events(this,e?[]:["change"],function(){this.clear(e),this.addItems(t,e)})},setMaxItems:function(t){this.settings.maxItems=t=0===t?null:t,this.settings.mode=this.settings.mode||(1===this.settings.maxItems?"single":"multi"),this.refreshState()},setActiveItem:function(t,e){var n,i,o,s,r,a,l=this;if("single"!==l.settings.mode)if((t=$(t)).length){if("mousedown"===(n=e&&e.type.toLowerCase())&&l.isShiftDown&&l.$activeItems.length){for(a=l.$control.children(".active:last"),a=Array.prototype.indexOf.apply(l.$control[0].childNodes,[a[0]]),(o=Array.prototype.indexOf.apply(l.$control[0].childNodes,[t[0]]))<a&&(r=a,a=o,o=r),i=a;i<=o;i++)s=l.$control[0].childNodes[i],-1===l.$activeItems.indexOf(s)&&($(s).addClass("active"),l.$activeItems.push(s));e.preventDefault()}else"mousedown"===n&&l.isCtrlDown||"keydown"===n&&this.isShiftDown?t.hasClass("active")?(r=l.$activeItems.indexOf(t[0]),l.$activeItems.splice(r,1),t.removeClass("active")):l.$activeItems.push(t.addClass("active")[0]):($(l.$activeItems).removeClass("active"),l.$activeItems=[t.addClass("active")[0]]);l.hideInput(),this.isFocused||l.focus()}else $(l.$activeItems).removeClass("active"),l.$activeItems=[],l.isFocused&&l.showInput()},setActiveOption:function(t,e,n){var i,o,s,r,a=this;a.$activeOption&&(a.$activeOption.removeClass("active"),a.trigger("dropdown_item_deactivate",a.$activeOption.attr("data-value"))),a.$activeOption=null,(t=$(t)).length&&(a.$activeOption=t.addClass("active"),a.isOpen&&a.trigger("dropdown_item_activate",a.$activeOption.attr("data-value")),!e&&isset(e)||(t=a.$dropdown_content.height(),i=a.$activeOption.outerHeight(!0),e=a.$dropdown_content.scrollTop()||0,r=(s=o=a.$activeOption.offset().top-a.$dropdown_content.offset().top+e)-t+i,t+e<o+i?a.$dropdown_content.stop().animate({scrollTop:r},n?a.settings.scrollDuration:0):o<e&&a.$dropdown_content.stop().animate({scrollTop:s},n?a.settings.scrollDuration:0)))},selectAll:function(){var t=this;"single"!==t.settings.mode&&(t.$activeItems=Array.prototype.slice.apply(t.$control.children(":not(input)").addClass("active")),t.$activeItems.length&&(t.hideInput(),t.close()),t.focus())},hideInput:function(){this.setTextboxValue(""),this.$control_input.css({opacity:0,position:"absolute",left:this.rtl?1e4:0}),this.isInputHidden=!0},showInput:function(){this.$control_input.css({opacity:1,position:"relative",left:0}),this.isInputHidden=!1},focus:function(){var t=this;return t.isDisabled||(t.ignoreFocus=!0,t.$control_input[0].focus(),window.setTimeout(function(){t.ignoreFocus=!1,t.onFocus()},0)),t},blur:function(t){return this.$control_input[0].blur(),this.onBlur(null,t),this},getScoreFunction:function(t){return this.sifter.getScoreFunction(t,this.getSearchOptions())},getSearchOptions:function(){var t=this.settings,e=t.sortField;return{fields:t.searchField,conjunction:t.searchConjunction,sort:e="string"==typeof e?[{field:e}]:e,nesting:t.nesting,filter:t.filter,respect_word_boundaries:t.respect_word_boundaries}},search:function(t){var e,n,i,o=this,s=o.settings,r=this.getSearchOptions();if(s.score&&"function"!=typeof(i=o.settings.score.apply(this,[t])))throw new Error('Selectize "score" setting must be a function that returns a function');if(t!==o.lastQuery?(s.normalize&&(t=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"")),o.lastQuery=t,n=o.sifter.search(t,$.extend(r,{score:i})),o.currentResults=n):n=$.extend(!0,{},o.currentResults),s.hideSelected)for(e=n.items.length-1;0<=e;e--)-1!==o.items.indexOf(hash_key(n.items[e].id))&&n.items.splice(e,1);return n},refreshOptions:function(t){void 0===t&&(t=!0);var e,n,i,o,s,r,a,l,p,c,d,u,h,g=this,f=g.$control_input.val().trim(),v=g.search(f),m=g.$dropdown_content,y=g.$activeOption&&hash_key(g.$activeOption.attr("data-value")),w=v.items.length;for("number"==typeof g.settings.maxOptions&&(w=Math.min(w,g.settings.maxOptions)),o={},s=[],e=0;e<w;e++)for(r=g.options[v.items[e].id],a=g.render("option",r),O=r[g.settings.optgroupField]||"",n=0,i=(l=Array.isArray(O)?O:[O])&&l.length;n<i;n++){var C,O=l[n];g.optgroups.hasOwnProperty(O)||"function"!=typeof g.settings.optionGroupRegister||(C=g.settings.optionGroupRegister.apply(g,[O]))&&g.registerOptionGroup(C),g.optgroups.hasOwnProperty(O)||(O=""),o.hasOwnProperty(O)||(o[O]=document.createDocumentFragment(),s.push(O)),o[O].appendChild(a)}for(this.settings.lockOptgroupOrder&&s.sort(function(t,e){return(g.optgroups[t]&&g.optgroups[t].$order||0)-(g.optgroups[e]&&g.optgroups[e].$order||0)}),p=document.createDocumentFragment(),e=0,w=s.length;e<w;e++)g.optgroups.hasOwnProperty(O=s[e])&&o[O].childNodes.length?((c=document.createDocumentFragment()).appendChild(g.render("optgroup_header",g.optgroups[O])),c.appendChild(o[O]),p.appendChild(g.render("optgroup",$.extend({},g.optgroups[O],{html:domToString(c),dom:c})))):p.appendChild(o[O]);if(m.html(p),g.settings.highlight&&(m.removeHighlight(),v.query.length)&&v.tokens.length)for(e=0,w=v.tokens.length;e<w;e++)highlight(m,v.tokens[e].regex);if(!g.settings.hideSelected)for(g.$dropdown.find(".selected").removeClass("selected"),e=0,w=g.items.length;e<w;e++)g.getOption(g.items[e]).addClass("selected");"auto"!==g.settings.dropdownSize.sizeType&&g.isOpen&&g.setupDropdownHeight(),g.positionDropdown(),(d=g.canCreate(f))&&g.settings.showAddOptionOnCreate&&(m.prepend(g.render("option_create",{input:f})),h=$(m[0].childNodes[0])),g.hasOptions=0<v.items.length||d&&g.settings.showAddOptionOnCreate||g.settings.setFirstOptionActive,g.hasOptions?(0<v.items.length?(f=y&&g.getOption(y),""!==v.query&&g.settings.setFirstOptionActive?u=m.find("[data-selectable]:first"):""!==v.query&&f&&f.length?u=f:"single"===g.settings.mode&&g.items.length&&(u=g.getOption(g.items[0])),u&&u.length||(u=h&&!g.settings.addPrecedence?g.getAdjacentOption(h,1):m.find("[data-selectable]:first"))):u=h,g.setActiveOption(u),t&&!g.isOpen&&g.open()):(g.setActiveOption(null),t&&g.isOpen&&g.close())},addOption:function(t){var e,n,i,o=this;if(Array.isArray(t))for(e=0,n=t.length;e<n;e++)o.addOption(t[e]);else(i=o.registerOption(t))&&(o.userOptions[i]=!0,o.lastQuery=null,o.trigger("option_add",i,t))},registerOption:function(t){var e=hash_key(t[this.settings.valueField]);return null!=e&&!this.options.hasOwnProperty(e)&&(t.$order=t.$order||++this.order,this.options[e]=t,e)},registerOptionGroup:function(t){var e=hash_key(t[this.settings.optgroupValueField]);return!!e&&(t.$order=t.$order||++this.order,this.optgroups[e]=t,e)},addOptionGroup:function(t,e){e[this.settings.optgroupValueField]=t,(t=this.registerOptionGroup(e))&&this.trigger("optgroup_add",t,e)},removeOptionGroup:function(t){this.optgroups.hasOwnProperty(t)&&(delete this.optgroups[t],this.renderCache={},this.trigger("optgroup_remove",t))},clearOptionGroups:function(){this.optgroups={},this.renderCache={},this.trigger("optgroup_clear")},updateOption:function(t,e){var n,i,o,s=this;if(t=hash_key(t),n=hash_key(e[s.settings.valueField]),null!==t&&s.options.hasOwnProperty(t)){if("string"!=typeof n)throw new Error("Value must be set in option data");o=s.options[t].$order,n!==t&&(delete s.options[t],-1!==(i=s.items.indexOf(t)))&&s.items.splice(i,1,n),e.$order=e.$order||o,s.options[n]=e,i=s.renderCache.item,o=s.renderCache.option,i&&(delete i[t],delete i[n]),o&&(delete o[t],delete o[n]),-1!==s.items.indexOf(n)&&(i=s.getItem(t),o=$(s.render("item",e)),i.hasClass("active")&&o.addClass("active"),i.replaceWith(o)),s.lastQuery=null,s.isOpen&&s.refreshOptions(!1)}},removeOption:function(t,e){var n=this,i=(t=hash_key(t),n.renderCache.item),o=n.renderCache.option;i&&delete i[t],o&&delete o[t],delete n.userOptions[t],delete n.options[t],n.lastQuery=null,n.trigger("option_remove",t),n.removeItem(t,e)},clearOptions:function(t){var n=this,i=(n.loadedSearches={},n.userOptions={},n.renderCache={},n.options);$.each(n.options,function(t,e){-1==n.items.indexOf(t)&&delete i[t]}),n.options=n.sifter.items=i,n.lastQuery=null,n.trigger("option_clear"),n.clear(t)},getOption:function(t){return this.getElementWithValue(t,this.$dropdown_content.find("[data-selectable]"))},getFirstOption:function(){var t=this.$dropdown.find("[data-selectable]");return 0<t.length?t.eq(0):$()},getAdjacentOption:function(t,e){var n=this.$dropdown.find("[data-selectable]"),t=n.index(t)+e;return 0<=t&&t<n.length?n.eq(t):$()},getElementWithValue:function(t,e){if(null!=(t=hash_key(t)))for(var n=0,i=e.length;n<i;n++)if(e[n].getAttribute("data-value")===t)return $(e[n]);return $()},getElementWithTextContent:function(t,e,n){if(null!=(t=hash_key(t)))for(var i=0,o=n.length;i<o;i++){var s=n[i].textContent;if(1==e&&(s=null!==s?s.toLowerCase():null,t=t.toLowerCase()),s===t)return $(n[i])}return $()},getItem:function(t){return this.getElementWithValue(t,this.$control.children())},getFirstItemMatchedByTextContent:function(t,e){return this.getElementWithTextContent(t,e=null!==e&&!0===e,this.$dropdown_content.find("[data-selectable]"))},addItems:function(t,e){this.buffer=document.createDocumentFragment();for(var n=this.$control[0].childNodes,i=0;i<n.length;i++)this.buffer.appendChild(n[i]);for(var o=Array.isArray(t)?t:[t],i=0,s=o.length;i<s;i++)this.isPending=i<s-1,this.addItem(o[i],e);t=this.$control[0];t.insertBefore(this.buffer,t.firstChild),this.buffer=null},addItem:function(s,r){debounce_events(this,r?[]:["change"],function(){var t,e,n,i=this,o=i.settings.mode;s=hash_key(s),-1!==i.items.indexOf(s)?"single"===o&&i.close():i.options.hasOwnProperty(s)&&("single"===o&&i.clear(r),"multi"===o&&i.isFull()||(t=$(i.render("item",i.options[s])),n=i.isFull(),i.items.splice(i.caretPos,0,s),i.insertAtCaret(t),i.isPending&&(n||!i.isFull())||i.refreshState(),i.isSetup&&(n=i.$dropdown_content.find("[data-selectable]"),i.isPending||(e=i.getOption(s),e=i.getAdjacentOption(e,1).attr("data-value"),i.refreshOptions(i.isFocused&&"single"!==o),e&&i.setActiveOption(i.getOption(e))),!n.length||i.isFull()?i.close():i.isPending||i.positionDropdown(),i.updatePlaceholder(),i.trigger("item_add",s,t),i.isPending||i.updateOriginalInput({silent:r}))))})},removeItem:function(t,e){var n,i,o=this,s=t instanceof $?t:o.getItem(t);t=hash_key(s.attr("data-value")),-1!==(n=o.items.indexOf(t))&&(o.trigger("item_before_remove",t,s),s.remove(),s.hasClass("active")&&(s.removeClass("active"),i=o.$activeItems.indexOf(s[0]),o.$activeItems.splice(i,1),s.removeClass("active")),o.items.splice(n,1),o.lastQuery=null,!o.settings.persist&&o.userOptions.hasOwnProperty(t)&&o.removeOption(t,e),n<o.caretPos&&o.setCaret(o.caretPos-1),o.refreshState(),o.updatePlaceholder(),o.updateOriginalInput({silent:e}),o.positionDropdown(),o.trigger("item_remove",t,s))},createItem:function(t,n){var i=this,o=i.caretPos,s=(t=t||(i.$control_input.val()||"").trim(),arguments[arguments.length-1]);if("function"!=typeof s&&(s=function(){}),"boolean"!=typeof n&&(n=!0),!i.canCreate(t))return s(),!1;i.lock();var e="function"==typeof i.settings.create?this.settings.create:function(t){var e={},t=e[i.settings.labelField]=t;if(!i.settings.formatValueToKey||"function"!=typeof i.settings.formatValueToKey||null!=(t=i.settings.formatValueToKey.apply(this,[t]))&&"object"!=typeof t&&"function"!=typeof t)return e[i.settings.valueField]=t,e;throw new Error('Selectize "formatValueToKey" setting must be a function that returns a value other than object or function.')},r=once(function(t){var e;return i.unlock(),!t||"object"!=typeof t||"string"!=typeof(e=hash_key(t[i.settings.valueField]))?s():(i.setTextboxValue(""),i.addOption(t),i.setCaret(o),i.addItem(e),i.refreshOptions(n&&"single"!==i.settings.mode),void s(t))}),e=e.apply(this,[t,r]);return void 0!==e&&r(e),!0},refreshItems:function(t){this.lastQuery=null,this.isSetup&&this.addItem(this.items,t),this.refreshState(),this.updateOriginalInput({silent:t})},refreshState:function(){this.refreshValidityState(),this.refreshClasses()},refreshValidityState:function(){if(!this.isRequired)return!1;var t=!this.items.length;this.isInvalid=t,this.$control_input.prop("required",t),this.$input.prop("required",!t)},refreshClasses:function(){var t=this,e=t.isFull(),n=t.isLocked;t.$wrapper.toggleClass("rtl",t.rtl),t.$control.toggleClass("focus",t.isFocused).toggleClass("disabled",t.isDisabled).toggleClass("required",t.isRequired).toggleClass("invalid",t.isInvalid).toggleClass("locked",n).toggleClass("full",e).toggleClass("not-full",!e).toggleClass("input-active",t.isFocused&&!t.isInputHidden).toggleClass("dropdown-active",t.isOpen).toggleClass("has-options",!$.isEmptyObject(t.options)).toggleClass("has-items",0<t.items.length),t.$control_input.data("grow",!e&&!n)},isFull:function(){return null!==this.settings.maxItems&&this.items.length>=this.settings.maxItems},updateOriginalInput:function(t){var e,n,i,o,s,r,a=this;t=t||{},a.tagType===TAG_SELECT?(o=a.$input.find("option"),e=[],n=[],i=[],r=[],o.get().forEach(function(t){e.push(t.value)}),a.items.forEach(function(t){s=a.options[t][a.settings.labelField]||"",r.push(t),-1==e.indexOf(t)&&n.push('<option value="'+escape_html(t)+'" selected="selected">'+escape_html(s)+"</option>")}),i=e.filter(function(t){return r.indexOf(t)<0}).map(function(t){return'option[value="'+escape_html(t)+'"]'}),e.length-i.length+n.length!==0||a.$input.attr("multiple")||n.push('<option value="" selected="selected"></option>'),a.$input.find(i.join(", ")).remove(),a.$input.append(n.join(""))):(a.$input.val(a.getValue()),a.$input.attr("value",a.$input.val())),a.isSetup&&!t.silent&&a.trigger("change",a.$input.val())},updatePlaceholder:function(){var t;this.settings.placeholder&&(t=this.$control_input,this.items.length?t.removeAttr("placeholder"):t.attr("placeholder",this.settings.placeholder),t.triggerHandler("update",{force:!0}))},open:function(){var t=this;t.isLocked||t.isOpen||"multi"===t.settings.mode&&t.isFull()||(t.focus(),t.isOpen=!0,t.refreshState(),t.$dropdown.css({visibility:"hidden",display:"block"}),t.setupDropdownHeight(),t.positionDropdown(),t.$dropdown.css({visibility:"visible"}),t.trigger("dropdown_open",t.$dropdown))},close:function(){var t=this,e=t.isOpen;"single"===t.settings.mode&&t.items.length&&(t.hideInput(),t.isBlurring)&&t.$control_input[0].blur(),t.isOpen=!1,t.$dropdown.hide(),t.setActiveOption(null),t.refreshState(),e&&t.trigger("dropdown_close",t.$dropdown)},positionDropdown:function(){var t=this.$control,e="body"===this.settings.dropdownParent?t.offset():t.position(),n=(e.top+=t.outerHeight(!0),"fit-content"===this.$wrapper[0].style.width||"body"===this.settings.dropdownParent?"max-content":"100%");this.settings.minWidth&&this.settings.minWidth>n&&(n=this.settings.minWidth),"body"!==this.settings.dropdownParent&&"max-content"===n&&t.outerWidth(!0)>=this.$dropdown.outerWidth(!0)&&(n="100%"),this.$dropdown.css({width:n,minWidth:t.outerWidth(!0),top:e.top,left:e.left})},setupDropdownHeight:function(){if("object"==typeof this.settings.dropdownSize&&"auto"!==this.settings.dropdownSize.sizeType){var t=this.settings.dropdownSize.sizeValue;if("numberItems"===this.settings.dropdownSize.sizeType){for(var e=this.$dropdown_content.find("*").not(".optgroup, .highlight").not(this.settings.ignoreOnDropwdownHeight),n=0,i=0,o=0,s=0,r=0;r<t;r++){var a=$(e[r]);if(0===a.length)break;n+=a.outerHeight(!0),void 0===a.data("selectable")&&(a.hasClass("optgroup-header")&&(a=window.getComputedStyle(a.parent()[0],":before"))&&(i=a.marginTop?Number(a.marginTop.replace(/\W*(\w)\w*/g,"$1")):0,o=a.marginBottom?Number(a.marginBottom.replace(/\W*(\w)\w*/g,"$1")):0,s=a.borderTopWidth?Number(a.borderTopWidth.replace(/\W*(\w)\w*/g,"$1")):0),t++)}t=n+(this.$dropdown_content.css("padding-top")?Number(this.$dropdown_content.css("padding-top").replace(/\W*(\w)\w*/g,"$1")):0)+(this.$dropdown_content.css("padding-bottom")?Number(this.$dropdown_content.css("padding-bottom").replace(/\W*(\w)\w*/g,"$1")):0)+i+o+s+"px"}else if("fixedHeight"!==this.settings.dropdownSize.sizeType)return void console.warn('Selectize.js - Value of "sizeType" must be "fixedHeight" or "numberItems');this.$dropdown_content.css({height:t,maxHeight:"none"})}},clear:function(t){var e=this;e.items.length&&(e.$control.children(":not(input)").remove(),e.items=[],e.lastQuery=null,e.setCaret(0),e.setActiveItem(null),e.updatePlaceholder(),e.updateOriginalInput({silent:t}),e.refreshState(),e.showInput(),e.trigger("clear"))},insertAtCaret:function(t){var e=Math.min(this.caretPos,this.items.length),t=t[0],n=this.buffer||this.$control[0];0===e?n.insertBefore(t,n.firstChild):n.insertBefore(t,n.childNodes[e]),this.setCaret(e+1)},deleteSelection:function(t){var e,n,i,o,s,r=this,a=t&&t.keyCode===KEY_BACKSPACE?-1:1,l=getInputSelection(r.$control_input[0]);if(r.$activeOption&&!r.settings.hideSelected&&(o=("string"==typeof r.settings.deselectBehavior&&"top"===r.settings.deselectBehavior?r.getFirstOption():r.getAdjacentOption(r.$activeOption,-1)).attr("data-value")),i=[],r.$activeItems.length){for(s=r.$control.children(".active:"+(0<a?"last":"first")),s=r.$control.children(":not(input)").index(s),0<a&&s++,e=0,n=r.$activeItems.length;e<n;e++)i.push($(r.$activeItems[e]).attr("data-value"));t&&(t.preventDefault(),t.stopPropagation())}else(r.isFocused||"single"===r.settings.mode)&&r.items.length&&(a<0&&0===l.start&&0===l.length?i.push(r.items[r.caretPos-1]):0<a&&l.start===r.$control_input.val().length&&i.push(r.items[r.caretPos]));if(!i.length||"function"==typeof r.settings.onDelete&&!1===r.settings.onDelete.apply(r,[i]))return!1;for(void 0!==s&&r.setCaret(s);i.length;)r.removeItem(i.pop());return r.showInput(),r.positionDropdown(),r.refreshOptions(!0),o&&(t=r.getOption(o)).length&&r.setActiveOption(t),!0},advanceSelection:function(t,e){var n,i,o,s=this;0!==t&&(s.rtl&&(t*=-1),n=0<t?"last":"first",o=getInputSelection(s.$control_input[0]),s.isFocused&&!s.isInputHidden?(i=s.$control_input.val().length,(t<0?0!==o.start||0!==o.length:o.start!==i)||i||s.advanceCaret(t,e)):(o=s.$control.children(".active:"+n)).length&&(i=s.$control.children(":not(input)").index(o),s.setActiveItem(null),s.setCaret(0<t?i+1:i)))},advanceCaret:function(t,e){var n,i=this;0!==t&&(i.isShiftDown?(n=i.$control_input[0<t?"next":"prev"]()).length&&(i.hideInput(),i.setActiveItem(n),e)&&e.preventDefault():i.setCaret(i.caretPos+t))},setCaret:function(t){var e=this;if(t="single"===e.settings.mode?e.items.length:Math.max(0,Math.min(e.items.length,t)),!e.isPending)for(var n,i=e.$control.children(":not(input)"),o=0,s=i.length;o<s;o++)n=$(i[o]).detach(),o<t?e.$control_input.before(n):e.$control.append(n);e.caretPos=t},lock:function(){this.close(),this.isLocked=!0,this.refreshState()},unlock:function(){this.isLocked=!1,this.refreshState()},disable:function(){this.$input.prop("disabled",!0),this.$control_input.prop("disabled",!0).prop("tabindex",-1),this.isDisabled=!0,this.lock()},enable:function(){var t=this;t.$input.prop("disabled",!1),t.$control_input.prop("disabled",!1).prop("tabindex",t.tabIndex),t.isDisabled=!1,t.unlock()},destroy:function(){var t=this,e=t.eventNS,n=t.revertSettings;t.trigger("destroy"),t.off(),t.$wrapper.remove(),t.$dropdown.remove(),t.$input.html("").append(n.$children).removeAttr("tabindex").removeClass("selectized").attr({tabindex:n.tabindex}).show(),t.$control_input.removeData("grow"),t.$input.removeData("selectize"),0==--Selectize.count&&Selectize.$testInput&&(Selectize.$testInput.remove(),Selectize.$testInput=void 0),$(window).off(e),$(document).off(e),$(document.body).off(e),delete t.$input[0].selectize},render:function(t,e){var n,i,o="",s=!1,r=this;return(s="option"!==t&&"item"!==t?s:!!(n=hash_key(e[r.settings.valueField])))&&(isset(r.renderCache[t])||(r.renderCache[t]={}),r.renderCache[t].hasOwnProperty(n))?r.renderCache[t][n]:(o=$(r.settings.render[t].apply(this,[e,escape_html])),"option"===t||"option_create"===t?e[r.settings.disabledField]||o.attr("data-selectable",""):"optgroup"===t&&(i=e[r.settings.optgroupValueField]||"",o.attr("data-group",i),e[r.settings.disabledField])&&o.attr("data-disabled",""),"option"!==t&&"item"!==t||o.attr("data-value",n||""),s&&(r.renderCache[t][n]=o[0]),o[0])},clearCache:function(t){void 0===t?this.renderCache={}:delete this.renderCache[t]},canCreate:function(t){var e;return!!this.settings.create&&(e=this.settings.createFilter,t.length)&&("function"!=typeof e||e.apply(this,[t]))&&("string"!=typeof e||new RegExp(e).test(t))&&(!(e instanceof RegExp)||e.test(t))}}),Selectize.count=0,Selectize.defaults={options:[],optgroups:[],plugins:[],delimiter:",",splitOn:null,persist:!0,diacritics:!0,create:!1,showAddOptionOnCreate:!0,createOnBlur:!1,createFilter:null,highlight:!0,openOnFocus:!0,maxOptions:1e3,maxItems:null,hideSelected:null,addPrecedence:!1,selectOnTab:!0,preload:!1,allowEmptyOption:!1,showEmptyOptionInDropdown:!1,emptyOptionLabel:"--",setFirstOptionActive:!1,closeAfterSelect:!1,closeDropdownThreshold:250,scrollDuration:60,deselectBehavior:"previous",loadThrottle:300,loadingClass:"loading",dataAttr:"data-data",optgroupField:"optgroup",valueField:"value",labelField:"text",disabledField:"disabled",optgroupLabelField:"label",optgroupValueField:"value",lockOptgroupOrder:!1,sortField:"$order",searchField:["text"],searchConjunction:"and",respect_word_boundaries:!1,normalize:!0,mode:null,wrapperClass:"",inputClass:"",dropdownClass:"",dropdownContentClass:"",dropdownParent:null,copyClassesToDropdown:!0,dropdownSize:{sizeType:"auto",sizeValue:"auto"},ignoreOnDropwdownHeight:"img, i",search:!0,showArrow:!0,render:{}},$.fn.selectize=function(c){function d(t,o){function e(t,e){t=$(t);var n,i=hash_key(t.val());(i||v.allowEmptyOption)&&(l.hasOwnProperty(i)?e&&((n=l[i][O])?Array.isArray(n)?n.push(e):l[i][O]=[n,e]:l[i][O]=e):((n=p(t)||{})[y]=n[y]||t.text(),n[w]=n[w]||i,n[C]=n[C]||t.prop("disabled"),n[O]=n[O]||e,n.styles=t.attr("style")||"",n.classes=t.attr("class")||"",l[i]=n,a.push(n),t.is(":selected")&&o.items.push(i)))}var n,i,s,r,a=o.options,l={},p=function(t){var e=m&&t.attr(m),t=t.data(),n={};return"string"==typeof e&&e.length&&(isJSON(e)?Object.assign(n,JSON.parse(e)):n[e]=e),Object.assign(n,t),n||null};for(o.maxItems=t.attr("multiple")?null:1,n=0,i=(r=t.children()).length;n<i;n++)if("optgroup"===(s=r[n].tagName.toLowerCase())){g=h=u=d=c=void 0;var c,d,u,h,g,f=r[n];for((u=(f=$(f)).attr("label"))&&((h=p(f)||{})[_]=u,h[b]=u,h[C]=f.prop("disabled"),o.optgroups.push(h)),c=0,d=(g=$("option",f)).length;c<d;c++)e(g[c],u)}else"option"===s&&e(r[n])}var u=$.fn.selectize.defaults,v=$.extend({},u,c),m=v.dataAttr,y=v.labelField,w=v.valueField,C=v.disabledField,O=v.optgroupField,_=v.optgroupLabelField,b=v.optgroupValueField;return this.each(function(){if(!this.selectize){var t=$(this),e=this.tagName.toLowerCase(),n=t.attr("placeholder")||t.attr("data-placeholder"),i=(n||v.allowEmptyOption||(n=t.children('option[value=""]').text()),v.allowEmptyOption&&v.showEmptyOptionInDropdown&&!t.children('option[value=""]').length&&(l=t.html(),i=escape_html(v.emptyOptionLabel||"--"),t.html('<option value="">'+i+"</option>"+l)),{placeholder:n,options:[],optgroups:[],items:[]});if("select"===e)d(t,i);else{var o,s,r,a,l=t,p=i,n=l.attr(m);if(n)for(p.options=JSON.parse(n),o=0,s=p.options.length;o<s;o++)p.items.push(p.options[o][w]);else{n=(l.val()||"").trim();if(v.allowEmptyOption||n.length){for(o=0,s=(r=n.split(v.delimiter)).length;o<s;o++)(a={})[y]=r[o],a[w]=r[o],p.options.push(a);p.items=r}}}new Selectize(t,$.extend(!0,{},u,i,c)).settings_user=c}})},$.fn.selectize.defaults=Selectize.defaults,$.fn.selectize.support={validity:SUPPORTS_VALIDITY_API},Selectize.define("auto_position",function(){var r=this;const a={top:"top",bottom:"bottom"};r.positionDropdown=function(){var t=this.$control,e="body"===this.settings.dropdownParent?t.offset():t.position(),n=(e.top+=t.outerHeight(!0),this.$dropdown.prop("scrollHeight")+5),i=this.$control.get(0).getBoundingClientRect().top,o=this.$wrapper.height(),s=r.$control.get(0).getBoundingClientRect().bottom,i=i+n+o>window.innerHeight&&0<=s-n-o?a.top:a.bottom,s="fit-content"===this.$wrapper[0].style.width||"body"===this.settings.dropdownParent?"max-content":"100%",n={width:s,minWidth:t.outerWidth(!0),left:e.left};i===a.top?(o={bottom:e.top,top:"unset"},"body"===this.settings.dropdownParent&&(o.top=e.top-this.$dropdown.outerHeight(!0)-t.outerHeight(!0),o.bottom="unset"),Object.assign(n,o),this.$dropdown.addClass("selectize-position-top"),this.$control.addClass("selectize-position-top")):(Object.assign(n,{top:e.top,bottom:"unset"}),this.$dropdown.removeClass("selectize-position-top"),this.$control.removeClass("selectize-position-top")),"body"!==this.settings.dropdownParent&&"max-content"==s&&(t.outerWidth(!0),this.$dropdown.outerWidth(!0)),this.$dropdown.css(n)}}),Selectize.define("auto_select_on_type",function(t){var n,i=this;i.onBlur=(n=i.onBlur,function(t){var e=i.getFirstItemMatchedByTextContent(i.lastValue,!0);return void 0!==e.attr("data-value")&&i.getValue()!==e.attr("data-value")&&i.setValue(e.attr("data-value")),n.apply(this,arguments)})}),Selectize.define("autofill_disable",function(t){var e,n=this;n.setup=(e=n.setup,function(){e.apply(n,arguments),n.$control_input.attr({name:nanoid(21),autocomplete:nanoid(21)})})}),Selectize.define("clear_button",function(e){var t,n=this;e=$.extend({title:"Clear",className:"clear",label:"×",html:function(t){return'<a class="'+t.className+'" title="'+t.title+'"> '+t.label+"</a>"}},e),n.setup=(t=n.setup,function(){t.apply(n,arguments),n.$button_clear=$(e.html(e)),"single"===n.settings.mode&&n.$wrapper.addClass("single"),n.$wrapper.append(n.$button_clear),""!==n.getValue()&&0!==n.getValue().length||n.$wrapper.find("."+e.className).css("display","none"),n.on("change",function(){""===n.getValue()||0===n.getValue().length?n.$wrapper.find("."+e.className).css("display","none"):n.$wrapper.find("."+e.className).css("display","")}),n.$wrapper.on("click","."+e.className,function(t){t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),n.isLocked||(n.clear(),n.$wrapper.find("."+e.className).css("display","none"))})})}),Selectize.define("drag_drop",function(t){if(!$.fn.sortable)throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');var i,e,n,o;"multi"===this.settings.mode&&((i=this).lock=(e=i.lock,function(){var t=i.$control.data("sortable");return t&&t.disable(),e.apply(i,arguments)}),i.unlock=(n=i.unlock,function(){var t=i.$control.data("sortable");return t&&t.enable(),n.apply(i,arguments)}),i.setup=(o=i.setup,function(){o.apply(this,arguments);var n=i.$control.sortable({items:"[data-value]",forcePlaceholderSize:!0,disabled:i.isLocked,start:function(t,e){e.placeholder.css("width",e.helper.css("width")),n.addClass("dragging")},stop:function(){n.removeClass("dragging");var t=i.$activeItems?i.$activeItems.slice():null,e=[];n.children("[data-value]").each(function(){e.push($(this).attr("data-value"))}),i.isFocused=!1,i.setValue(e),i.isFocused=!0,i.setActiveItem(t),i.positionDropdown()}})}))}),Selectize.define("dropdown_header",function(t){var e,n=this;t=$.extend({title:"Untitled",headerClass:"selectize-dropdown-header",titleRowClass:"selectize-dropdown-header-title",labelClass:"selectize-dropdown-header-label",closeClass:"selectize-dropdown-header-close",html:function(t){return'<div class="'+t.headerClass+'"><div class="'+t.titleRowClass+'"><span class="'+t.labelClass+'">'+t.title+'</span><a href="javascript:void(0)" class="'+t.closeClass+'">&#xd7;</a></div></div>'}},t),n.setup=(e=n.setup,function(){e.apply(n,arguments),n.$dropdown_header=$(t.html(t)),n.$dropdown.prepend(n.$dropdown_header),n.$dropdown_header.find("."+t.closeClass).on("click",function(){n.close()})})}),Selectize.define("optgroup_columns",function(r){function t(){var t,e,n,i,o=$("[data-group]",a.$dropdown_content),s=o.length;if(s&&a.$dropdown_content.width()){if(r.equalizeHeight){for(t=e=0;t<s;t++)e=Math.max(e,o.eq(t).height());o.css({height:e})}r.equalizeWidth&&(i=a.$dropdown_content.innerWidth()-l(),n=Math.round(i/s),o.css({width:n}),1<s)&&(i=i-n*(s-1),o.eq(s-1).css({width:i}))}}var i,a=this,l=(r=$.extend({equalizeWidth:!0,equalizeHeight:!0},r),this.getAdjacentOption=function(t,e){var n=t.closest("[data-group]").find("[data-selectable]"),t=n.index(t)+e;return 0<=t&&t<n.length?n.eq(t):$()},this.onKeyDown=(i=a.onKeyDown,function(t){var e,n;if(!this.isOpen||t.keyCode!==KEY_LEFT&&t.keyCode!==KEY_RIGHT)return i.apply(this,arguments);a.ignoreHover=!0,e=(n=this.$activeOption.closest("[data-group]")).find("[data-selectable]").index(this.$activeOption),(n=(n=(n=t.keyCode===KEY_LEFT?n.prev("[data-group]"):n.next("[data-group]")).find("[data-selectable]")).eq(Math.min(n.length-1,e))).length&&this.setActiveOption(n)}),function(){var t,e=l.width,n=document;return void 0===e&&((t=n.createElement("div")).innerHTML='<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>',t=t.firstChild,n.body.appendChild(t),e=l.width=t.offsetWidth-t.clientWidth,n.body.removeChild(t)),e});(r.equalizeHeight||r.equalizeWidth)&&(hook.after(this,"positionDropdown",t),hook.after(this,"refreshOptions",t))}),Selectize.define("read-only",function(t){var e;this.setup=(e=this.setup,function(){e.apply(this,arguments),this.$dropdown.hasClass("read-only")&&this.$control_input.attr("readonly","readonly")}),this.readonly=function(t){t?(this.$control_input.attr("readonly","readonly"),this.$dropdown.addClass("read-only")):(this.$control_input.removeAttr("readonly"),this.$dropdown.removeClass("read-only"))}}),Selectize.define("remove_button",function(t){var s,e,n,i,r;"single"!==this.settings.mode&&(t=$.extend({label:"&#xd7;",title:"Remove",className:"remove",append:!0},t),i=s=this,r='<a href="javascript:void(0)" class="'+(e=t).className+'" tabindex="-1" title="'+escape_html(e.title)+'">'+e.label+"</a>",s.setup=(n=i.setup,function(){var o;e.append&&(o=i.settings.render.item,i.settings.render.item=function(t){return e=o.apply(s,arguments),n=r,i=e.search(/(<\/[^>]+>\s*)$/),e.substring(0,i)+n+e.substring(i);var e,n,i}),n.apply(s,arguments),s.$control.on("click","."+e.className,function(t){if(t.preventDefault(),!i.isLocked)return t=$(t.currentTarget).parent(),i.setActiveItem(t),i.deleteSelection()&&i.setCaret(i.items.length),!1})}))}),Selectize.define("restore_on_backspace",function(n){var i,t=this;n.text=n.text||function(t){return t[this.settings.labelField]},this.onKeyDown=(i=t.onKeyDown,function(t){var e;if(!(t.keyCode===KEY_BACKSPACE&&""===this.$control_input.val()&&!this.$activeItems.length&&0<=(e=this.caretPos-1)&&e<this.items.length))return i.apply(this,arguments);e=this.options[this.items[e]],this.deleteSelection(t)&&(this.setTextboxValue(n.text.apply(this,[e])),this.refreshOptions(!0)),t.preventDefault()})}),Selectize.define("select_on_focus",function(t){var n,e,i=this;i.on("focus",(n=i.onFocus,function(t){var e=i.getItem(i.getValue()).text();return i.clear(),i.setTextboxValue(e),i.$control_input.select(),setTimeout(function(){i.settings.selectOnTab&&i.setActiveOption(i.getFirstItemMatchedByTextContent(e)),i.settings.score=null},0),n.apply(this,arguments)})),i.onBlur=(e=i.onBlur,function(t){return""===i.getValue()&&i.lastValidValue!==i.getValue()&&i.setValue(i.lastValidValue),setTimeout(function(){i.settings.score=function(){return function(){return 1}}},0),e.apply(this,arguments)}),i.settings.score=function(){return function(){return 1}}}),Selectize.define("tag_limit",function(o){const t=this;o.tagLimit=o.tagLimit,this.onBlur=function(){const i=t.onBlur;return function(t){if(i.apply(this,t),t){var t=this.$control,e=t.find(".item");const n=o.tagLimit;void 0===n||e.length<=n||(e.toArray().forEach(function(t,e){e<n||$(t).hide()}),t.append("<span><b>"+(e.length-n)+"</b></span>"))}}}(),this.onFocus=function(){const e=t.onFocus;return function(t){e.apply(this,t),t&&((t=this.$control).find(".item").show(),t.find("span").remove())}}()});
  return Selectize;
}));

/*!
 * Isotope PACKAGED v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */
!function(e,i){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(t){return i(e,t)}):"object"==typeof module&&module.exports?module.exports=i(e,require("jquery")):e.jQueryBridget=i(e,e.jQuery)}(window,function(t,e){"use strict";function i(u,n,c){(c=c||e||t.jQuery)&&(n.prototype.option||(n.prototype.option=function(t){c.isPlainObject(t)&&(this.options=c.extend(!0,this.options,t))}),c.fn[u]=function(t){return"string"!=typeof t?(function(t,o){t.each(function(t,e){var i=c.data(e,u);i?(i.option(o),i._init()):(i=new n(e,o),c.data(e,u,i))})}(this,t),this):function(t,s,r){var a,h="$()."+u+'("'+s+'")';return t.each(function(t,e){var i=c.data(e,u);if(i){var o=i[s];if(o&&"_"!=s.charAt(0)){var n=o.apply(i,r);a=void 0===a?n:a}else d(h+" is not a valid method")}else d(u+" not initialized. Cannot call methods, i.e. "+h)}),void 0!==a?a:t}(this,t,s.call(arguments,1))},o(c))}function o(t){!t||t&&t.bridget||(t.bridget=i)}var s=Array.prototype.slice,n=t.console,d=void 0===n?function(){}:function(t){n.error(t)};return o(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},o=i[t]=i[t]||[];return-1==o.indexOf(e)&&o.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{};return(i[t]=i[t]||{})[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var o=i.indexOf(e);return-1!=o&&i.splice(o,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var o=this._onceEvents&&this._onceEvents[t],n=0;n<i.length;n++){var s=i[n];o&&o[s]&&(this.off(t,s),delete o[s]),s.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t}),function(t,e){"function"==typeof define&&define.amd?define("get-size/get-size",e):"object"==typeof module&&module.exports?module.exports=e():t.getSize=e()}(window,function(){"use strict";function y(t){var e=parseFloat(t);return-1==t.indexOf("%")&&!isNaN(e)&&e}function v(t){var e=getComputedStyle(t);return e||i("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? See https://bit.ly/getsizebug1"),e}function _(t){if(function(){if(!b){b=!0;var t=document.createElement("div");t.style.width="200px",t.style.padding="1px 2px 3px 4px",t.style.borderStyle="solid",t.style.borderWidth="1px 2px 3px 4px",t.style.boxSizing="border-box";var e=document.body||document.documentElement;e.appendChild(t);var i=v(t);x=200==Math.round(y(i.width)),_.isBoxSizeOuter=x,e.removeChild(t)}}(),"string"==typeof t&&(t=document.querySelector(t)),t&&"object"==typeof t&&t.nodeType){var e=v(t);if("none"==e.display)return function(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0;e<I;e++){t[z[e]]=0}return t}();var i={};i.width=t.offsetWidth,i.height=t.offsetHeight;for(var o=i.isBorderBox="border-box"==e.boxSizing,n=0;n<I;n++){var s=z[n],r=e[s],a=parseFloat(r);i[s]=isNaN(a)?0:a}var h=i.paddingLeft+i.paddingRight,u=i.paddingTop+i.paddingBottom,c=i.marginLeft+i.marginRight,d=i.marginTop+i.marginBottom,l=i.borderLeftWidth+i.borderRightWidth,f=i.borderTopWidth+i.borderBottomWidth,p=o&&x,m=y(e.width);!1!==m&&(i.width=m+(p?0:h+l));var g=y(e.height);return!1!==g&&(i.height=g+(p?0:u+f)),i.innerWidth=i.width-(h+l),i.innerHeight=i.height-(u+f),i.outerWidth=i.width+c,i.outerHeight=i.height+d,i}}var x,i="undefined"==typeof console?function(){}:function(t){console.error(t)},z=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"],I=z.length,b=!1;return _}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("desandro-matches-selector/matches-selector",e):"object"==typeof module&&module.exports?module.exports=e():t.matchesSelector=e()}(window,function(){"use strict";var i=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var o=e[i]+"MatchesSelector";if(t[o])return o}}();return function(t,e){return t[i](e)}}),function(e,i){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["desandro-matches-selector/matches-selector"],function(t){return i(e,t)}):"object"==typeof module&&module.exports?module.exports=i(e,require("desandro-matches-selector")):e.fizzyUIUtils=i(e,e.matchesSelector)}(window,function(u,s){var c={extend:function(t,e){for(var i in e)t[i]=e[i];return t},modulo:function(t,e){return(t%e+e)%e}},e=Array.prototype.slice;c.makeArray=function(t){return Array.isArray(t)?t:null==t?[]:"object"==typeof t&&"number"==typeof t.length?e.call(t):[t]},c.removeFrom=function(t,e){var i=t.indexOf(e);-1!=i&&t.splice(i,1)},c.getParent=function(t,e){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,s(t,e))return t},c.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},c.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},c.filterFindElements=function(t,o){t=c.makeArray(t);var n=[];return t.forEach(function(t){if(t instanceof HTMLElement){if(!o)return void n.push(t);s(t,o)&&n.push(t);for(var e=t.querySelectorAll(o),i=0;i<e.length;i++)n.push(e[i])}}),n},c.debounceMethod=function(t,e,o){o=o||100;var n=t.prototype[e],s=e+"Timeout";t.prototype[e]=function(){var t=this[s];clearTimeout(t);var e=arguments,i=this;this[s]=setTimeout(function(){n.apply(i,e),delete i[s]},o)}},c.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},c.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var d=u.console;return c.htmlInit=function(a,h){c.docReady(function(){var t=c.toDashed(h),n="data-"+t,e=document.querySelectorAll("["+n+"]"),i=document.querySelectorAll(".js-"+t),o=c.makeArray(e).concat(c.makeArray(i)),s=n+"-options",r=u.jQuery;o.forEach(function(e){var t,i=e.getAttribute(n)||e.getAttribute(s);try{t=i&&JSON.parse(i)}catch(t){return void(d&&d.error("Error parsing "+n+" on "+e.className+": "+t))}var o=new a(e,t);r&&r.data(e,h,o)})})},c}),function(t,e){"function"==typeof define&&define.amd?define("outlayer/item",["ev-emitter/ev-emitter","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("ev-emitter"),require("get-size")):(t.Outlayer={},t.Outlayer.Item=e(t.EvEmitter,t.getSize))}(window,function(t,e){"use strict";function i(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}var o=document.documentElement.style,n="string"==typeof o.transition?"transition":"WebkitTransition",s="string"==typeof o.transform?"transform":"WebkitTransform",r={WebkitTransition:"webkitTransitionEnd",transition:"transitionend"}[n],a={transform:s,transition:n,transitionDuration:n+"Duration",transitionProperty:n+"Property",transitionDelay:n+"Delay"},h=i.prototype=Object.create(t.prototype);h.constructor=i,h._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},h.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},h.getSize=function(){this.size=e(this.element)},h.css=function(t){var e=this.element.style;for(var i in t){e[a[i]||i]=t[i]}},h.getPosition=function(){var t=getComputedStyle(this.element),e=this.layout._getOption("originLeft"),i=this.layout._getOption("originTop"),o=t[e?"left":"right"],n=t[i?"top":"bottom"],s=parseFloat(o),r=parseFloat(n),a=this.layout.size;-1!=o.indexOf("%")&&(s=s/100*a.width),-1!=n.indexOf("%")&&(r=r/100*a.height),s=isNaN(s)?0:s,r=isNaN(r)?0:r,s-=e?a.paddingLeft:a.paddingRight,r-=i?a.paddingTop:a.paddingBottom,this.position.x=s,this.position.y=r},h.layoutPosition=function(){var t=this.layout.size,e={},i=this.layout._getOption("originLeft"),o=this.layout._getOption("originTop"),n=i?"paddingLeft":"paddingRight",s=i?"left":"right",r=i?"right":"left",a=this.position.x+t[n];e[s]=this.getXValue(a),e[r]="";var h=o?"paddingTop":"paddingBottom",u=o?"top":"bottom",c=o?"bottom":"top",d=this.position.y+t[h];e[u]=this.getYValue(d),e[c]="",this.css(e),this.emitEvent("layout",[this])},h.getXValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&!e?t/this.layout.size.width*100+"%":t+"px"},h.getYValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&e?t/this.layout.size.height*100+"%":t+"px"},h._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=t==this.position.x&&e==this.position.y;if(this.setPosition(t,e),!n||this.isTransitioning){var s=t-i,r=e-o,a={};a.transform=this.getTranslate(s,r),this.transition({to:a,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})}else this.layoutPosition()},h.getTranslate=function(t,e){return"translate3d("+(t=this.layout._getOption("originLeft")?t:-t)+"px, "+(e=this.layout._getOption("originTop")?e:-e)+"px, 0)"},h.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},h.moveTo=h._transitionTo,h.setPosition=function(t,e){this.position.x=parseFloat(t),this.position.y=parseFloat(e)},h._nonTransition=function(t){for(var e in this.css(t.to),t.isCleaning&&this._removeStyles(t.to),t.onTransitionEnd)t.onTransitionEnd[e].call(this)},h.transition=function(t){if(parseFloat(this.layout.options.transitionDuration)){var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);this.element.offsetHeight;null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0}else this._nonTransition(t)};var u="opacity,"+s.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()});h.enableTransition=function(){if(!this.isTransitioning){var t=this.layout.options.transitionDuration;t="number"==typeof t?t+"ms":t,this.css({transitionProperty:u,transitionDuration:t,transitionDelay:this.staggerDelay||0}),this.element.addEventListener(r,this,!1)}},h.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},h.onotransitionend=function(t){this.ontransitionend(t)};var c={"-webkit-transform":"transform"};h.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,i=c[t.propertyName]||t.propertyName;if(delete e.ingProperties[i],function(t){for(var e in t)return!1;return!null}(e.ingProperties)&&this.disableTransition(),i in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[i]),i in e.onEnd)e.onEnd[i].call(this),delete e.onEnd[i];this.emitEvent("transitionEnd",[this])}},h.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(r,this,!1),this.isTransitioning=!1},h._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var d={transitionProperty:"",transitionDuration:"",transitionDelay:""};return h.removeTransitionStyles=function(){this.css(d)},h.stagger=function(t){t=isNaN(t)?0:t,this.staggerDelay=t+"ms"},h.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},h.remove=function(){return n&&parseFloat(this.layout.options.transitionDuration)?(this.once("transitionEnd",function(){this.removeElem()}),void this.hide()):void this.removeElem()},h.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options,e={};e[this.getHideRevealTransitionEndProperty("visibleStyle")]=this.onRevealTransitionEnd,this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0,onTransitionEnd:e})},h.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},h.getHideRevealTransitionEndProperty=function(t){var e=this.layout.options[t];if(e.opacity)return"opacity";for(var i in e)return i},h.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options,e={};e[this.getHideRevealTransitionEndProperty("hiddenStyle")]=this.onHideTransitionEnd,this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:e})},h.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},h.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},i}),function(n,s){"use strict";"function"==typeof define&&define.amd?define("outlayer/outlayer",["ev-emitter/ev-emitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(t,e,i,o){return s(n,t,e,i,o)}):"object"==typeof module&&module.exports?module.exports=s(n,require("ev-emitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):n.Outlayer=s(n,n.EvEmitter,n.getSize,n.fizzyUIUtils,n.Outlayer.Item)}(window,function(t,e,n,s,o){"use strict";function r(t,e){var i=s.getQueryElement(t);if(i){this.element=i,u&&(this.$element=u(this.element)),this.options=s.extend({},this.constructor.defaults),this.option(e);var o=++c;this.element.outlayerGUID=o,(d[o]=this)._create(),this._getOption("initLayout")&&this.layout()}else h&&h.error("Bad element for "+this.constructor.namespace+": "+(i||t))}function a(t){function e(){t.apply(this,arguments)}return(e.prototype=Object.create(t.prototype)).constructor=e}function i(){}var h=t.console,u=t.jQuery,c=0,d={};r.namespace="outlayer",r.Item=o,r.defaults={containerStyle:{position:"relative"},initLayout:!0,originLeft:!0,originTop:!0,resize:!0,resizeContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}};var l=r.prototype;s.extend(l,e.prototype),l.option=function(t){s.extend(this.options,t)},l._getOption=function(t){var e=this.constructor.compatOptions[t];return e&&void 0!==this.options[e]?this.options[e]:this.options[t]},r.compatOptions={initLayout:"isInitLayout",horizontal:"isHorizontal",layoutInstant:"isLayoutInstant",originLeft:"isOriginLeft",originTop:"isOriginTop",resize:"isResizeBound",resizeContainer:"isResizingContainer"},l._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),s.extend(this.element.style,this.options.containerStyle),this._getOption("resize")&&this.bindResize()},l.reloadItems=function(){this.items=this._itemize(this.element.children)},l._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0;n<e.length;n++){var s=new i(e[n],this);o.push(s)}return o},l._filterFindItemElements=function(t){return s.filterFindElements(t,this.options.itemSelector)},l.getItemElements=function(){return this.items.map(function(t){return t.element})},l.layout=function(){this._resetLayout(),this._manageStamps();var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;this.layoutItems(this.items,e),this._isLayoutInited=!0},l._init=l.layout,l._resetLayout=function(){this.getSize()},l.getSize=function(){this.size=n(this.element)},l._getMeasurement=function(t,e){var i,o=this.options[t];o?("string"==typeof o?i=this.element.querySelector(o):o instanceof HTMLElement&&(i=o),this[t]=i?n(i)[e]:o):this[t]=0},l.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},l._getItemsForLayout=function(t){return t.filter(function(t){return!t.isIgnored})},l._layoutItems=function(t,i){if(this._emitCompleteOnItems("layout",t),t&&t.length){var o=[];t.forEach(function(t){var e=this._getItemLayoutPosition(t);e.item=t,e.isInstant=i||t.isLayoutInstant,o.push(e)},this),this._processLayoutQueue(o)}},l._getItemLayoutPosition=function(){return{x:0,y:0}},l._processLayoutQueue=function(t){this.updateStagger(),t.forEach(function(t,e){this._positionItem(t.item,t.x,t.y,t.isInstant,e)},this)},l.updateStagger=function(){var t=this.options.stagger;return null==t?void(this.stagger=0):(this.stagger=function(t){if("number"==typeof t)return t;var e=t.match(/(^\d*\.?\d*)(\w*)/),i=e&&e[1],o=e&&e[2];return i.length?(i=parseFloat(i))*(f[o]||1):0}(t),this.stagger)},l._positionItem=function(t,e,i,o,n){o?t.goTo(e,i):(t.stagger(n*this.stagger),t.moveTo(e,i))},l._postLayout=function(){this.resizeContainer()},l.resizeContainer=function(){if(this._getOption("resizeContainer")){var t=this._getContainerSize();t&&(this._setContainerMeasure(t.width,!0),this._setContainerMeasure(t.height,!1))}},l._getContainerSize=i,l._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},l._emitCompleteOnItems=function(e,t){function i(){n.dispatchEvent(e+"Complete",null,[t])}function o(){++r==s&&i()}var n=this,s=t.length;if(t&&s){var r=0;t.forEach(function(t){t.once(e,o)})}else i()},l.dispatchEvent=function(t,e,i){var o=e?[e].concat(i):i;if(this.emitEvent(t,o),u)if(this.$element=this.$element||u(this.element),e){var n=u.Event(e);n.type=t,this.$element.trigger(n,i)}else this.$element.trigger(t,i)},l.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},l.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},l.stamp=function(t){(t=this._find(t))&&(this.stamps=this.stamps.concat(t),t.forEach(this.ignore,this))},l.unstamp=function(t){(t=this._find(t))&&t.forEach(function(t){s.removeFrom(this.stamps,t),this.unignore(t)},this)},l._find=function(t){if(t)return"string"==typeof t&&(t=this.element.querySelectorAll(t)),s.makeArray(t)},l._manageStamps=function(){this.stamps&&this.stamps.length&&(this._getBoundingRect(),this.stamps.forEach(this._manageStamp,this))},l._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},l._manageStamp=i,l._getElementOffset=function(t){var e=t.getBoundingClientRect(),i=this._boundingRect,o=n(t);return{left:e.left-i.left-o.marginLeft,top:e.top-i.top-o.marginTop,right:i.right-e.right-o.marginRight,bottom:i.bottom-e.bottom-o.marginBottom}},l.handleEvent=s.handleEvent,l.bindResize=function(){t.addEventListener("resize",this),this.isResizeBound=!0},l.unbindResize=function(){t.removeEventListener("resize",this),this.isResizeBound=!1},l.onresize=function(){this.resize()},s.debounceMethod(r,"onresize",100),l.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},l.needsResizeLayout=function(){var t=n(this.element);return this.size&&t&&t.innerWidth!==this.size.innerWidth},l.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},l.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},l.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},l.reveal=function(t){if(this._emitCompleteOnItems("reveal",t),t&&t.length){var i=this.updateStagger();t.forEach(function(t,e){t.stagger(e*i),t.reveal()})}},l.hide=function(t){if(this._emitCompleteOnItems("hide",t),t&&t.length){var i=this.updateStagger();t.forEach(function(t,e){t.stagger(e*i),t.hide()})}},l.revealItemElements=function(t){var e=this.getItems(t);this.reveal(e)},l.hideItemElements=function(t){var e=this.getItems(t);this.hide(e)},l.getItem=function(t){for(var e=0;e<this.items.length;e++){var i=this.items[e];if(i.element==t)return i}},l.getItems=function(t){t=s.makeArray(t);var i=[];return t.forEach(function(t){var e=this.getItem(t);e&&i.push(e)},this),i},l.remove=function(t){var e=this.getItems(t);this._emitCompleteOnItems("remove",e),e&&e.length&&e.forEach(function(t){t.remove(),s.removeFrom(this.items,t)},this)},l.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="",this.items.forEach(function(t){t.destroy()}),this.unbindResize();var e=this.element.outlayerGUID;delete d[e],delete this.element.outlayerGUID,u&&u.removeData(this.element,this.constructor.namespace)},r.data=function(t){var e=(t=s.getQueryElement(t))&&t.outlayerGUID;return e&&d[e]},r.create=function(t,e){var i=a(r);return i.defaults=s.extend({},r.defaults),s.extend(i.defaults,e),i.compatOptions=s.extend({},r.compatOptions),i.namespace=t,i.data=r.data,i.Item=a(o),s.htmlInit(i,t),u&&u.bridget&&u.bridget(t,i),i};var f={ms:1,s:1e3};return r.Item=o,r}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/item",["outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window,function(t){"use strict";function e(){t.Item.apply(this,arguments)}var i=e.prototype=Object.create(t.Item.prototype),o=i._create;i._create=function(){this.id=this.layout.itemGUID++,o.call(this),this.sortData={}},i.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}};var n=i.destroy;return i.destroy=function(){n.apply(this,arguments),this.css({display:""})},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("get-size"),require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window,function(e,i){"use strict";function o(t){(this.isotope=t)&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}var n=o.prototype;return["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout","_getOption"].forEach(function(t){n[t]=function(){return i.prototype[t].apply(this.isotope,arguments)}}),n.needsVerticalResizeLayout=function(){var t=e(this.isotope.element);return this.isotope.size&&t&&t.innerHeight!=this.isotope.size.innerHeight},n._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},n.getColumnWidth=function(){this.getSegmentSize("column","Width")},n.getRowHeight=function(){this.getSegmentSize("row","Height")},n.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},n.getFirstItemSize=function(){var t=this.isotope.filteredItems[0];return t&&t.element&&e(t.element)},n.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},n.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},o.modes={},o.create=function(t,e){function i(){o.apply(this,arguments)}return(i.prototype=Object.create(n)).constructor=i,e&&(i.options=e),o.modes[i.prototype.namespace=t]=i},o}),function(t,e){"function"==typeof define&&define.amd?define("masonry-layout/masonry",["outlayer/outlayer","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer"),require("get-size")):t.Masonry=e(t.Outlayer,t.getSize)}(window,function(t,u){var e=t.create("masonry");e.compatOptions.fitWidth="isFitWidth";var i=e.prototype;return i._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns(),this.colYs=[];for(var t=0;t<this.cols;t++)this.colYs.push(0);this.maxY=0,this.horizontalColIndex=0},i.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],e=t&&t.element;this.columnWidth=e&&u(e).outerWidth||this.containerWidth}var i=this.columnWidth+=this.gutter,o=this.containerWidth+this.gutter,n=o/i,s=i-o%i;n=Math[s&&s<1?"round":"floor"](n),this.cols=Math.max(n,1)},i.getContainerWidth=function(){var t=this._getOption("fitWidth")?this.element.parentNode:this.element,e=u(t);this.containerWidth=e&&e.innerWidth},i._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,i=Math[e&&e<1?"round":"ceil"](t.size.outerWidth/this.columnWidth);i=Math.min(i,this.cols);for(var o=this[this.options.horizontalOrder?"_getHorizontalColPosition":"_getTopColPosition"](i,t),n={x:this.columnWidth*o.col,y:o.y},s=o.y+t.size.outerHeight,r=i+o.col,a=o.col;a<r;a++)this.colYs[a]=s;return n},i._getTopColPosition=function(t){var e=this._getTopColGroup(t),i=Math.min.apply(Math,e);return{col:e.indexOf(i),y:i}},i._getTopColGroup=function(t){if(t<2)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;o<i;o++)e[o]=this._getColGroupY(o,t);return e},i._getColGroupY=function(t,e){if(e<2)return this.colYs[t];var i=this.colYs.slice(t,t+e);return Math.max.apply(Math,i)},i._getHorizontalColPosition=function(t,e){var i=this.horizontalColIndex%this.cols;i=1<t&&i+t>this.cols?0:i;var o=e.size.outerWidth&&e.size.outerHeight;return this.horizontalColIndex=o?i+t:this.horizontalColIndex,{col:i,y:this._getColGroupY(i,t)}},i._manageStamp=function(t){var e=u(t),i=this._getElementOffset(t),o=this._getOption("originLeft")?i.left:i.right,n=o+e.outerWidth,s=Math.floor(o/this.columnWidth);s=Math.max(0,s);var r=Math.floor(n/this.columnWidth);r-=n%this.columnWidth?0:1,r=Math.min(this.cols-1,r);for(var a=(this._getOption("originTop")?i.top:i.bottom)+e.outerHeight,h=s;h<=r;h++)this.colYs[h]=Math.max(a,this.colYs[h])},i._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this._getOption("fitWidth")&&(t.width=this._getContainerFitWidth()),t},i._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},i.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!=this.containerWidth},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/masonry",["../layout-mode","masonry-layout/masonry"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode"),require("masonry-layout")):e(t.Isotope.LayoutMode,t.Masonry)}(window,function(t,e){"use strict";var i=t.create("masonry"),o=i.prototype,n={_getElementOffset:!0,layout:!0,_getMeasurement:!0};for(var s in e.prototype)n[s]||(o[s]=e.prototype[s]);var r=o.measureColumns;o.measureColumns=function(){this.items=this.isotope.filteredItems,r.call(this)};var a=o._getOption;return o._getOption=function(t){return"fitWidth"==t?void 0!==this.options.isFitWidth?this.options.isFitWidth:this.options.fitWidth:a.apply(this.isotope,arguments)},i}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/fit-rows",["../layout-mode"],e):"object"==typeof exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("fitRows"),i=e.prototype;return i._resetLayout=function(){this.x=0,this.y=0,this.maxY=0,this._getMeasurement("gutter","outerWidth")},i._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth+this.gutter,i=this.isotope.size.innerWidth+this.gutter;0!==this.x&&e+this.x>i&&(this.x=0,this.y=this.maxY);var o={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=e,o},i._getContainerSize=function(){return{height:this.maxY}},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/vertical",["../layout-mode"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("vertical",{horizontalAlignment:0}),i=e.prototype;return i._resetLayout=function(){this.y=0},i._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},i._getContainerSize=function(){return{height:this.y}},e}),function(r,a){"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","desandro-matches-selector/matches-selector","fizzy-ui-utils/utils","isotope-layout/js/item","isotope-layout/js/layout-mode","isotope-layout/js/layout-modes/masonry","isotope-layout/js/layout-modes/fit-rows","isotope-layout/js/layout-modes/vertical"],function(t,e,i,o,n,s){return a(r,t,e,i,o,n,s)}):"object"==typeof module&&module.exports?module.exports=a(r,require("outlayer"),require("get-size"),require("desandro-matches-selector"),require("fizzy-ui-utils"),require("isotope-layout/js/item"),require("isotope-layout/js/layout-mode"),require("isotope-layout/js/layout-modes/masonry"),require("isotope-layout/js/layout-modes/fit-rows"),require("isotope-layout/js/layout-modes/vertical")):r.Isotope=a(r,r.Outlayer,r.getSize,r.matchesSelector,r.fizzyUIUtils,r.Isotope.Item,r.Isotope.LayoutMode)}(window,function(t,i,e,o,s,n,r){var a=t.jQuery,h=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},u=i.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});u.Item=n,u.LayoutMode=r;var c=u.prototype;c._create=function(){for(var t in this.itemGUID=0,this._sorters={},this._getSorters(),i.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"],r.modes)this._initLayoutMode(t)},c.reloadItems=function(){this.itemGUID=0,i.prototype.reloadItems.call(this)},c._itemize=function(){for(var t=i.prototype._itemize.apply(this,arguments),e=0;e<t.length;e++){t[e].id=this.itemGUID++}return this._updateItemsSortData(t),t},c._initLayoutMode=function(t){var e=r.modes[t],i=this.options[t]||{};this.options[t]=e.options?s.extend(e.options,i):i,this.modes[t]=new e(this)},c.layout=function(){return!this._isLayoutInited&&this._getOption("initLayout")?void this.arrange():void this._layout()},c._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},c.arrange=function(t){this.option(t),this._getIsInstant();var e=this._filter(this.items);this.filteredItems=e.matches,this._bindArrangeComplete(),this._isInstant?this._noTransition(this._hideReveal,[e]):this._hideReveal(e),this._sort(),this._layout()},c._init=c.arrange,c._hideReveal=function(t){this.reveal(t.needReveal),this.hide(t.needHide)},c._getIsInstant=function(){var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;return this._isInstant=e},c._bindArrangeComplete=function(){function t(){e&&i&&o&&n.dispatchEvent("arrangeComplete",null,[n.filteredItems])}var e,i,o,n=this;this.once("layoutComplete",function(){e=!0,t()}),this.once("hideComplete",function(){i=!0,t()}),this.once("revealComplete",function(){o=!0,t()})},c._filter=function(t){var e=this.options.filter;e=e||"*";for(var i=[],o=[],n=[],s=this._getFilterTest(e),r=0;r<t.length;r++){var a=t[r];if(!a.isIgnored){var h=s(a);h&&i.push(a),h&&a.isHidden?o.push(a):h||a.isHidden||n.push(a)}}return{matches:i,needReveal:o,needHide:n}},c._getFilterTest=function(e){return a&&this.options.isJQueryFiltering?function(t){return a(t.element).is(e)}:"function"==typeof e?function(t){return e(t.element)}:function(t){return o(t.element,e)}},c.updateSortData=function(t){var e;e=t?(t=s.makeArray(t),this.getItems(t)):this.items,this._getSorters(),this._updateItemsSortData(e)},c._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=d(i)}},c._updateItemsSortData=function(t){for(var e=t&&t.length,i=0;e&&i<e;i++){t[i].updateSortData()}};var d=function(t){if("string"!=typeof t)return t;var e=h(t).split(" "),i=e[0],o=i.match(/^\[(.+)\]$/),n=function(e,i){return e?function(t){return t.getAttribute(e)}:function(t){var e=t.querySelector(i);return e&&e.textContent}}(o&&o[1],i),s=u.sortDataParsers[e[1]];return s?function(t){return t&&s(n(t))}:function(t){return t&&n(t)}};u.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},c._sort=function(){if(this.options.sortBy){var t=s.makeArray(this.options.sortBy);this._getIsSameSortBy(t)||(this.sortHistory=t.concat(this.sortHistory));var e=function(r,a){return function(t,e){for(var i=0;i<r.length;i++){var o=r[i],n=t.sortData[o],s=e.sortData[o];if(s<n||n<s)return(s<n?1:-1)*((void 0!==a[o]?a[o]:a)?1:-1)}return 0}}(this.sortHistory,this.options.sortAscending);this.filteredItems.sort(e)}},c._getIsSameSortBy=function(t){for(var e=0;e<t.length;e++)if(t[e]!=this.sortHistory[e])return!1;return!0},c._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw new Error("No layout mode: "+t);return e.options=this.options[t],e},c._resetLayout=function(){i.prototype._resetLayout.call(this),this._mode()._resetLayout()},c._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},c._manageStamp=function(t){this._mode()._manageStamp(t)},c._getContainerSize=function(){return this._mode()._getContainerSize()},c.needsResizeLayout=function(){return this._mode().needsResizeLayout()},c.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},c.prepended=function(t){var e=this._itemize(t);if(e.length){this._resetLayout(),this._manageStamps();var i=this._filterRevealAdded(e);this.layoutItems(this.filteredItems),this.filteredItems=i.concat(this.filteredItems),this.items=e.concat(this.items)}},c._filterRevealAdded=function(t){var e=this._filter(t);return this.hide(e.needHide),this.reveal(e.matches),this.layoutItems(e.matches,!0),e.matches},c.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;i<n;i++)o=e[i],this.element.appendChild(o.element);var s=this._filter(e).matches;for(i=0;i<n;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;i<n;i++)delete e[i].isLayoutInstant;this.reveal(s)}};var l=c.remove;return c.remove=function(t){t=s.makeArray(t);var e=this.getItems(t);l.call(this,t);for(var i=e&&e.length,o=0;i&&o<i;o++){var n=e[o];s.removeFrom(this.filteredItems,n)}},c.shuffle=function(){for(var t=0;t<this.items.length;t++){this.items[t].sortData.random=Math.random()}this.options.sortBy="random",this._sort(),this._layout()},c._noTransition=function(t,e){var i=this.options.transitionDuration;this.options.transitionDuration=0;var o=t.apply(this,e);return this.options.transitionDuration=i,o},c.getFilteredItemElements=function(){return this.filteredItems.map(function(t){return t.element})},u}),function(t,e){"function"==typeof define&&define.amd?define("packery/js/rect",e):"object"==typeof module&&module.exports?module.exports=e():(t.Packery=t.Packery||{},t.Packery.Rect=e())}(window,function(){function a(t){for(var e in a.defaults)this[e]=a.defaults[e];for(e in t)this[e]=t[e]}a.defaults={x:0,y:0,width:0,height:0};var t=a.prototype;return t.contains=function(t){var e=t.width||0,i=t.height||0;return this.x<=t.x&&this.y<=t.y&&this.x+this.width>=t.x+e&&this.y+this.height>=t.y+i},t.overlaps=function(t){var e=this.x+this.width,i=this.y+this.height,o=t.x+t.width,n=t.y+t.height;return this.x<o&&e>t.x&&this.y<n&&i>t.y},t.getMaximalFreeRects=function(t){if(!this.overlaps(t))return!1;var e,i=[],o=this.x+this.width,n=this.y+this.height,s=t.x+t.width,r=t.y+t.height;return this.y<t.y&&(e=new a({x:this.x,y:this.y,width:this.width,height:t.y-this.y}),i.push(e)),s<o&&(e=new a({x:s,y:this.y,width:o-s,height:this.height}),i.push(e)),r<n&&(e=new a({x:this.x,y:r,width:this.width,height:n-r}),i.push(e)),this.x<t.x&&(e=new a({x:this.x,y:this.y,width:t.x-this.x,height:this.height}),i.push(e)),i},t.canFit=function(t){return this.width>=t.width&&this.height>=t.height},a}),function(t,e){if("function"==typeof define&&define.amd)define("packery/js/packer",["./rect"],e);else if("object"==typeof module&&module.exports)module.exports=e(require("./rect"));else{var i=t.Packery=t.Packery||{};i.Packer=e(i.Rect)}}(window,function(e){function t(t,e,i){this.width=t||0,this.height=e||0,this.sortDirection=i||"downwardLeftToRight",this.reset()}var i=t.prototype;i.reset=function(){this.spaces=[];var t=new e({x:0,y:0,width:this.width,height:this.height});this.spaces.push(t),this.sorter=o[this.sortDirection]||o.downwardLeftToRight},i.pack=function(t){for(var e=0;e<this.spaces.length;e++){var i=this.spaces[e];if(i.canFit(t)){this.placeInSpace(t,i);break}}},i.columnPack=function(t){for(var e=0;e<this.spaces.length;e++){var i=this.spaces[e];if(i.x<=t.x&&i.x+i.width>=t.x+t.width&&i.height>=t.height-.01){t.y=i.y,this.placed(t);break}}},i.rowPack=function(t){for(var e=0;e<this.spaces.length;e++){var i=this.spaces[e];if(i.y<=t.y&&i.y+i.height>=t.y+t.height&&i.width>=t.width-.01){t.x=i.x,this.placed(t);break}}},i.placeInSpace=function(t,e){t.x=e.x,t.y=e.y,this.placed(t)},i.placed=function(t){for(var e=[],i=0;i<this.spaces.length;i++){var o=this.spaces[i],n=o.getMaximalFreeRects(t);n?e.push.apply(e,n):e.push(o)}this.spaces=e,this.mergeSortSpaces()},i.mergeSortSpaces=function(){t.mergeRects(this.spaces),this.spaces.sort(this.sorter)},i.addSpace=function(t){this.spaces.push(t),this.mergeSortSpaces()},t.mergeRects=function(t){var e=0,i=t[e];t:for(;i;){for(var o=0,n=t[e+o];n;){if(n==i)o++;else{if(n.contains(i)){t.splice(e,1),i=t[e];continue t}i.contains(n)?t.splice(e+o,1):o++}n=t[e+o]}i=t[++e]}return t};var o={downwardLeftToRight:function(t,e){return t.y-e.y||t.x-e.x},rightwardTopToBottom:function(t,e){return t.x-e.x||t.y-e.y}};return t}),function(t,e){"function"==typeof define&&define.amd?define("packery/js/item",["outlayer/outlayer","./rect"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer"),require("./rect")):t.Packery.Item=e(t.Outlayer,t.Packery.Rect)}(window,function(t,e){function i(){t.Item.apply(this,arguments)}var o="string"==typeof document.documentElement.style.transform?"transform":"WebkitTransform",n=i.prototype=Object.create(t.Item.prototype),s=n._create;n._create=function(){s.call(this),this.rect=new e};var r=n.moveTo;return n.moveTo=function(t,e){var i=Math.abs(this.position.x-t),o=Math.abs(this.position.y-e);return this.layout.dragItemCount&&!this.isPlacing&&!this.isTransitioning&&i<1&&o<1?void this.goTo(t,e):void r.apply(this,arguments)},n.enablePlacing=function(){this.removeTransitionStyles(),this.isTransitioning&&o&&(this.element.style[o]="none"),this.isTransitioning=!1,this.getSize(),this.layout._setRectSize(this.element,this.rect),this.isPlacing=!0},n.disablePlacing=function(){this.isPlacing=!1},n.removeElem=function(){this.element.parentNode.removeChild(this.element),this.layout.packer.addSpace(this.rect),this.emitEvent("remove",[this])},n.showDropPlaceholder=function(){var t=this.dropPlaceholder;t||((t=this.dropPlaceholder=document.createElement("div")).className="packery-drop-placeholder",t.style.position="absolute"),t.style.width=this.size.width+"px",t.style.height=this.size.height+"px",this.positionDropPlaceholder(),this.layout.element.appendChild(t)},n.positionDropPlaceholder=function(){this.dropPlaceholder.style[o]="translate("+this.rect.x+"px, "+this.rect.y+"px)"},n.hideDropPlaceholder=function(){this.layout.element.removeChild(this.dropPlaceholder)},i}),function(t,e){"function"==typeof define&&define.amd?define("packery/js/packery",["get-size/get-size","outlayer/outlayer","./rect","./packer","./item"],e):"object"==typeof module&&module.exports?module.exports=e(require("get-size"),require("outlayer"),require("./rect"),require("./packer"),require("./item")):t.Packery=e(t.getSize,t.Outlayer,t.Packery.Rect,t.Packery.Packer,t.Packery.Item)}(window,function(c,t,f,e,i){function o(t,e){return t.position.y-e.position.y||t.position.x-e.position.x}function n(t,e){return t.position.x-e.position.x||t.position.y-e.position.y}f.prototype.canFit=function(t){return this.width>=t.width-1&&this.height>=t.height-1};var s=t.create("packery");s.Item=i;var r=s.prototype;r._create=function(){t.prototype._create.call(this),this.packer=new e,this.shiftPacker=new e,this.isEnabled=!0,this.dragItemCount=0;var i=this;this.handleDraggabilly={dragStart:function(){i.itemDragStart(this.element)},dragMove:function(){i.itemDragMove(this.element,this.position.x,this.position.y)},dragEnd:function(){i.itemDragEnd(this.element)}},this.handleUIDraggable={start:function(t,e){e&&i.itemDragStart(t.currentTarget)},drag:function(t,e){e&&i.itemDragMove(t.currentTarget,e.position.left,e.position.top)},stop:function(t,e){e&&i.itemDragEnd(t.currentTarget)}}},r._resetLayout=function(){var t,e,i;this.getSize(),this._getMeasurements(),i=this._getOption("horizontal")?(t=1/0,e=this.size.innerHeight+this.gutter,"rightwardTopToBottom"):(t=this.size.innerWidth+this.gutter,e=1/0,"downwardLeftToRight"),this.packer.width=this.shiftPacker.width=t,this.packer.height=this.shiftPacker.height=e,this.packer.sortDirection=this.shiftPacker.sortDirection=i,this.packer.reset(),this.maxY=0,this.maxX=0},r._getMeasurements=function(){this._getMeasurement("columnWidth","width"),this._getMeasurement("rowHeight","height"),this._getMeasurement("gutter","width")},r._getItemLayoutPosition=function(t){if(this._setRectSize(t.element,t.rect),this.isShifting||0<this.dragItemCount){var e=this._getPackMethod();this.packer[e](t.rect)}else this.packer.pack(t.rect);return this._setMaxXY(t.rect),t.rect},r.shiftLayout=function(){this.isShifting=!0,this.layout(),delete this.isShifting},r._getPackMethod=function(){return this._getOption("horizontal")?"rowPack":"columnPack"},r._setMaxXY=function(t){this.maxX=Math.max(t.x+t.width,this.maxX),this.maxY=Math.max(t.y+t.height,this.maxY)},r._setRectSize=function(t,e){var i=c(t),o=i.outerWidth,n=i.outerHeight;(o||n)&&(o=this._applyGridGutter(o,this.columnWidth),n=this._applyGridGutter(n,this.rowHeight)),e.width=Math.min(o,this.packer.width),e.height=Math.min(n,this.packer.height)},r._applyGridGutter=function(t,e){if(!e)return t+this.gutter;var i=t%(e+=this.gutter);return Math[i&&i<1?"round":"ceil"](t/e)*e},r._getContainerSize=function(){return this._getOption("horizontal")?{width:this.maxX-this.gutter}:{height:this.maxY-this.gutter}},r._manageStamp=function(t){var e,i=this.getItem(t);if(i&&i.isPlacing)e=i.rect;else{var o=this._getElementOffset(t);e=new f({x:this._getOption("originLeft")?o.left:o.right,y:this._getOption("originTop")?o.top:o.bottom})}this._setRectSize(t,e),this.packer.placed(e),this._setMaxXY(e)},r.sortItemsByPosition=function(){var t=this._getOption("horizontal")?n:o;this.items.sort(t)},r.fit=function(t,e,i){var o=this.getItem(t);o&&(this.stamp(o.element),o.enablePlacing(),this.updateShiftTargets(o),e=void 0===e?o.rect.x:e,i=void 0===i?o.rect.y:i,this.shift(o,e,i),this._bindFitEvents(o),o.moveTo(o.rect.x,o.rect.y),this.shiftLayout(),this.unstamp(o.element),this.sortItemsByPosition(),o.disablePlacing())},r._bindFitEvents=function(t){function e(){2==++o&&i.dispatchEvent("fitComplete",null,[t])}var i=this,o=0;t.once("layout",e),this.once("layoutComplete",e)},r.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&(this.options.shiftPercentResize?this.resizeShiftPercentLayout():this.layout())},r.needsResizeLayout=function(){var t=c(this.element),e=this._getOption("horizontal")?"innerHeight":"innerWidth";return t[e]!=this.size[e]},r.resizeShiftPercentLayout=function(){var t=this._getItemsForLayout(this.items),e=this._getOption("horizontal"),i=e?"y":"x",o=e?"height":"width",n=e?"rowHeight":"columnWidth",s=e?"innerHeight":"innerWidth",r=this[n];if(r=r&&r+this.gutter){this._getMeasurements();var a=this[n]+this.gutter;t.forEach(function(t){var e=Math.round(t.rect[i]/r);t.rect[i]=e*a})}else{var h=c(this.element)[s]+this.gutter,u=this.packer[o];t.forEach(function(t){t.rect[i]=t.rect[i]/u*h})}this.shiftLayout()},r.itemDragStart=function(t){if(this.isEnabled){this.stamp(t);var e=this.getItem(t);e&&(e.enablePlacing(),e.showDropPlaceholder(),this.dragItemCount++,this.updateShiftTargets(e))}},r.updateShiftTargets=function(t){this.shiftPacker.reset(),this._getBoundingRect();var n=this._getOption("originLeft"),s=this._getOption("originTop");this.stamps.forEach(function(t){var e=this.getItem(t);if(!e||!e.isPlacing){var i=this._getElementOffset(t),o=new f({x:n?i.left:i.right,y:s?i.top:i.bottom});this._setRectSize(t,o),this.shiftPacker.placed(o)}},this);var h=this._getOption("horizontal"),e=h?"rowHeight":"columnWidth",u=h?"height":"width";this.shiftTargetKeys=[],this.shiftTargets=[];var c,d=this[e];if(d=d&&d+this.gutter){var i=Math.ceil(t.rect[u]/d),o=Math.floor((this.shiftPacker[u]+this.gutter)/d);c=(o-i)*d;for(var r=0;r<o;r++)this._addShiftTarget(r*d,0,c)}else c=this.shiftPacker[u]+this.gutter-t.rect[u],this._addShiftTarget(0,0,c);var a=this._getItemsForLayout(this.items),l=this._getPackMethod();a.forEach(function(t){var e=t.rect;this._setRectSize(t.element,e),this.shiftPacker[l](e),this._addShiftTarget(e.x,e.y,c);var i=h?e.x+e.width:e.x,o=h?e.y:e.y+e.height;if(this._addShiftTarget(i,o,c),d)for(var n=Math.round(e[u]/d),s=1;s<n;s++){var r=h?i:e.x+d*s,a=h?e.y+d*s:o;this._addShiftTarget(r,a,c)}},this)},r._addShiftTarget=function(t,e,i){var o=this._getOption("horizontal")?e:t;if(!(0!==o&&i<o)){var n=t+","+e;-1!=this.shiftTargetKeys.indexOf(n)||(this.shiftTargetKeys.push(n),this.shiftTargets.push({x:t,y:e}))}},r.shift=function(t,e,i){var o,n=1/0,s={x:e,y:i};this.shiftTargets.forEach(function(t){var e=function(t,e){var i=e.x-t.x,o=e.y-t.y;return Math.sqrt(i*i+o*o)}(t,s);e<n&&(o=t,n=e)}),t.rect.x=o.x,t.rect.y=o.y};r.itemDragMove=function(t,e,i){function o(){s.shift(n,e,i),n.positionDropPlaceholder(),s.layout()}var n=this.isEnabled&&this.getItem(t);if(n){e-=this.size.paddingLeft,i-=this.size.paddingTop;var s=this,r=new Date;this._itemDragTime&&r-this._itemDragTime<120?(clearTimeout(this.dragTimeout),this.dragTimeout=setTimeout(o,120)):(o(),this._itemDragTime=r)}},r.itemDragEnd=function(t){function e(){2==++o&&(i.element.classList.remove("is-positioning-post-drag"),i.hideDropPlaceholder(),n.dispatchEvent("dragItemPositioned",null,[i]))}var i=this.isEnabled&&this.getItem(t);if(i){clearTimeout(this.dragTimeout),i.element.classList.add("is-positioning-post-drag");var o=0,n=this;i.once("layout",e),this.once("layoutComplete",e),i.moveTo(i.rect.x,i.rect.y),this.layout(),this.dragItemCount=Math.max(0,this.dragItemCount-1),this.sortItemsByPosition(),i.disablePlacing(),this.unstamp(i.element)}},r.bindDraggabillyEvents=function(t){this._bindDraggabillyEvents(t,"on")},r.unbindDraggabillyEvents=function(t){this._bindDraggabillyEvents(t,"off")},r._bindDraggabillyEvents=function(t,e){var i=this.handleDraggabilly;t[e]("dragStart",i.dragStart),t[e]("dragMove",i.dragMove),t[e]("dragEnd",i.dragEnd)},r.bindUIDraggableEvents=function(t){this._bindUIDraggableEvents(t,"on")},r.unbindUIDraggableEvents=function(t){this._bindUIDraggableEvents(t,"off")},r._bindUIDraggableEvents=function(t,e){var i=this.handleUIDraggable;t[e]("dragstart",i.start)[e]("drag",i.drag)[e]("dragstop",i.stop)};var a=r.destroy;return r.destroy=function(){a.apply(this,arguments),this.isEnabled=!1},s.Rect=f,s.Packer=e,s}),function(t,e){"function"==typeof define&&define.amd?define(["isotope-layout/js/layout-mode","packery/js/packery"],e):"object"==typeof module&&module.exports?module.exports=e(require("isotope-layout/js/layout-mode"),require("packery")):e(t.Isotope.LayoutMode,t.Packery)}(window,function(t,e){var i=t.create("packery"),o=i.prototype,n={_getElementOffset:!0,_getMeasurement:!0};for(var s in e.prototype)n[s]||(o[s]=e.prototype[s]);var r=o._resetLayout;o._resetLayout=function(){this.packer=this.packer||new e.Packer,this.shiftPacker=this.shiftPacker||new e.Packer,r.apply(this,arguments)};var a=o._getItemLayoutPosition;o._getItemLayoutPosition=function(t){return t.rect=t.rect||new e.Rect,a.call(this,t)};var h=o.needsResizeLayout;o.needsResizeLayout=function(){return this._getOption("horizontal")?this.needsVerticalResizeLayout():h.call(this)};var u=o._getOption;return o._getOption=function(t){return"horizontal"==t?void 0!==this.options.isHorizontal?this.options.isHorizontal:this.options.horizontal:u.apply(this.isotope,arguments)},i});

// Ion.RangeSlider
// version 2.3.0 Build: 381
// © Denis Ineshin, 2018
// https://github.com/IonDen
//
// Project page:    http://ionden.com/a/plugins/ion.rangeSlider/en.html
// GitHub page:     https://github.com/IonDen/ion.rangeSlider
//
// Released under MIT licence:
// http://ionden.com/a/plugins/licence-en.html
!function(i){"function"==typeof define&&define.amd?define(["jquery"],function(t){return i(t,document,window,navigator)}):"object"==typeof exports?i(require("jquery"),document,window,navigator):i(jQuery,document,window,navigator)}(function(h,r,n,t,a){var i,s,o=0,e=(i=t.userAgent,s=/msie\s\d+/i,0<i.search(s)&&(i=(i=s.exec(i).toString()).split(" ")[1])<9&&(h("html").addClass("lt-ie9"),!0));Function.prototype.bind||(Function.prototype.bind=function(s){var o=this,e=[].slice;if("function"!=typeof o)throw new TypeError;var h=e.call(arguments,1),r=function(){if(this instanceof r){(t=function(){}).prototype=o.prototype;var t=new t,i=o.apply(t,h.concat(e.call(arguments)));return Object(i)===i?i:t}return o.apply(s,h.concat(e.call(arguments)))};return r}),Array.prototype.indexOf||(Array.prototype.indexOf=function(t,i){if(null==this)throw new TypeError('"this" is null or not defined');var s=Object(this),o=s.length>>>0;if(0==o)return-1;var e=+i||0;if(1/0===Math.abs(e)&&(e=0),o<=e)return-1;for(e=Math.max(0<=e?e:o-Math.abs(e),0);e<o;){if(e in s&&s[e]===t)return e;e++}return-1});function c(t,i,s){this.VERSION="2.2.0",this.input=t,this.plugin_count=s,this.old_to=this.old_from=this.update_tm=this.calc_count=this.current_plugin=0,this.raf_id=this.old_min_interval=null,this.no_diapason=this.force_redraw=this.dragging=!1,this.has_tab_index=!0,this.is_update=this.is_key=!1,this.is_start=!0,this.is_click=this.is_resize=this.is_active=this.is_finish=!1,i=i||{},this.$cache={win:h(n),body:h(r.body),input:h(t),cont:null,rs:null,min:null,max:null,from:null,to:null,single:null,bar:null,line:null,s_single:null,s_from:null,s_to:null,shad_single:null,shad_from:null,shad_to:null,edge:null,grid:null,grid_labels:[]},this.coords={x_gap:0,x_pointer:0,w_rs:0,w_rs_old:0,w_handle:0,p_gap:0,p_gap_left:0,p_gap_right:0,p_step:0,p_pointer:0,p_handle:0,p_single_fake:0,p_single_real:0,p_from_fake:0,p_from_real:0,p_to_fake:0,p_to_real:0,p_bar_x:0,p_bar_w:0,grid_gap:0,big_num:0,big:[],big_w:[],big_p:[],big_x:[]},this.labels={w_min:0,w_max:0,w_from:0,w_to:0,w_single:0,p_min:0,p_max:0,p_from_fake:0,p_from_left:0,p_to_fake:0,p_to_left:0,p_single_fake:0,p_single_left:0};var o,e=this.$cache.input;for(o in t=e.prop("value"),s={type:"single",min:10,max:100,from:null,to:null,step:1,min_interval:0,max_interval:0,drag_interval:!1,values:[],p_values:[],from_fixed:!1,from_min:null,from_max:null,from_shadow:!1,to_fixed:!1,to_min:null,to_max:null,to_shadow:!1,prettify_enabled:!0,prettify_separator:" ",prettify:null,force_edges:!1,keyboard:!0,grid:!1,grid_margin:!0,grid_num:4,grid_snap:!1,hide_min_max:!1,hide_from_to:!1,prefix:"",postfix:"",max_postfix:"",decorate_both:!0,values_separator:" — ",input_values_separator:";",disable:!1,block:!1,extra_classes:"",scope:null,onStart:null,onChange:null,onFinish:null,onUpdate:null},"INPUT"!==e[0].nodeName&&console&&console.warn&&console.warn("Base element should be <input>!",e[0]),(e={type:e.data("type"),min:e.data("min"),max:e.data("max"),from:e.data("from"),to:e.data("to"),step:e.data("step"),min_interval:e.data("minInterval"),max_interval:e.data("maxInterval"),drag_interval:e.data("dragInterval"),values:e.data("values"),from_fixed:e.data("fromFixed"),from_min:e.data("fromMin"),from_max:e.data("fromMax"),from_shadow:e.data("fromShadow"),to_fixed:e.data("toFixed"),to_min:e.data("toMin"),to_max:e.data("toMax"),to_shadow:e.data("toShadow"),prettify_enabled:e.data("prettifyEnabled"),prettify_separator:e.data("prettifySeparator"),force_edges:e.data("forceEdges"),keyboard:e.data("keyboard"),grid:e.data("grid"),grid_margin:e.data("gridMargin"),grid_num:e.data("gridNum"),grid_snap:e.data("gridSnap"),hide_min_max:e.data("hideMinMax"),hide_from_to:e.data("hideFromTo"),prefix:e.data("prefix"),postfix:e.data("postfix"),max_postfix:e.data("maxPostfix"),decorate_both:e.data("decorateBoth"),values_separator:e.data("valuesSeparator"),input_values_separator:e.data("inputValuesSeparator"),disable:e.data("disable"),block:e.data("block"),extra_classes:e.data("extraClasses")}).values=e.values&&e.values.split(","),e)e.hasOwnProperty(o)&&(e[o]!==a&&""!==e[o]||delete e[o]);t!==a&&""!==t&&((t=t.split(e.input_values_separator||i.input_values_separator||";"))[0]&&t[0]==+t[0]&&(t[0]=+t[0]),t[1]&&t[1]==+t[1]&&(t[1]=+t[1]),i&&i.values&&i.values.length?(s.from=t[0]&&i.values.indexOf(t[0]),s.to=t[1]&&i.values.indexOf(t[1])):(s.from=t[0]&&+t[0],s.to=t[1]&&+t[1])),h.extend(s,i),h.extend(s,e),this.options=s,this.update_check={},this.validate(),this.result={input:this.$cache.input,slider:null,min:this.options.min,max:this.options.max,from:this.options.from,from_percent:0,from_value:null,to:this.options.to,to_percent:0,to_value:null},this.init()}c.prototype={init:function(t){this.no_diapason=!1,this.coords.p_step=this.convertToPercent(this.options.step,!0),this.target="base",this.toggleInput(),this.append(),this.setMinMax(),t?(this.force_redraw=!0,this.calc(!0),this.callOnUpdate()):(this.force_redraw=!0,this.calc(!0),this.callOnStart()),this.updateScene()},append:function(){this.$cache.input.before('<span class="irs js-irs-'+this.plugin_count+" "+this.options.extra_classes+'"></span>'),this.$cache.input.prop("readonly",!0),this.$cache.cont=this.$cache.input.prev(),this.result.slider=this.$cache.cont,this.$cache.cont.html('<span class="irs"><span class="irs-line" tabindex="0"><span class="irs-line-left"></span><span class="irs-line-mid"></span><span class="irs-line-right"></span></span><span class="irs-min">0</span><span class="irs-max">1</span><span class="irs-from">0</span><span class="irs-to">0</span><span class="irs-single">0</span></span><span class="irs-grid"></span><span class="irs-bar"></span>'),this.$cache.rs=this.$cache.cont.find(".irs"),this.$cache.min=this.$cache.cont.find(".irs-min"),this.$cache.max=this.$cache.cont.find(".irs-max"),this.$cache.from=this.$cache.cont.find(".irs-from"),this.$cache.to=this.$cache.cont.find(".irs-to"),this.$cache.single=this.$cache.cont.find(".irs-single"),this.$cache.bar=this.$cache.cont.find(".irs-bar"),this.$cache.line=this.$cache.cont.find(".irs-line"),this.$cache.grid=this.$cache.cont.find(".irs-grid"),"single"===this.options.type?(this.$cache.cont.append('<span class="irs-bar-edge"></span><span class="irs-shadow shadow-single"></span><span class="irs-slider single"></span>'),this.$cache.edge=this.$cache.cont.find(".irs-bar-edge"),this.$cache.s_single=this.$cache.cont.find(".single"),this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.shad_single=this.$cache.cont.find(".shadow-single")):(this.$cache.cont.append('<span class="irs-shadow shadow-from"></span><span class="irs-shadow shadow-to"></span><span class="irs-slider from"></span><span class="irs-slider to"></span>'),this.$cache.s_from=this.$cache.cont.find(".from"),this.$cache.s_to=this.$cache.cont.find(".to"),this.$cache.shad_from=this.$cache.cont.find(".shadow-from"),this.$cache.shad_to=this.$cache.cont.find(".shadow-to"),this.setTopHandler()),this.options.hide_from_to&&(this.$cache.from[0].style.display="none",this.$cache.to[0].style.display="none",this.$cache.single[0].style.display="none"),this.appendGrid(),this.options.disable?(this.appendDisableMask(),this.$cache.input[0].disabled=!0):(this.$cache.input[0].disabled=!1,this.removeDisableMask(),this.bindEvents()),this.options.disable||(this.options.block?this.appendDisableMask():this.removeDisableMask()),this.options.drag_interval&&(this.$cache.bar[0].style.cursor="ew-resize")},setTopHandler:function(){var t=this.options.max,i=this.options.to;this.options.from>this.options.min&&i===t?this.$cache.s_from.addClass("type_last"):i<t&&this.$cache.s_to.addClass("type_last")},changeLevel:function(t){switch(t){case"single":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_single_fake),this.$cache.s_single.addClass("state_hover");break;case"from":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_from_fake),this.$cache.s_from.addClass("state_hover"),this.$cache.s_from.addClass("type_last"),this.$cache.s_to.removeClass("type_last");break;case"to":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_to_fake),this.$cache.s_to.addClass("state_hover"),this.$cache.s_to.addClass("type_last"),this.$cache.s_from.removeClass("type_last");break;case"both":this.coords.p_gap_left=this.toFixed(this.coords.p_pointer-this.coords.p_from_fake),this.coords.p_gap_right=this.toFixed(this.coords.p_to_fake-this.coords.p_pointer),this.$cache.s_to.removeClass("type_last"),this.$cache.s_from.removeClass("type_last")}},appendDisableMask:function(){this.$cache.cont.append('<span class="irs-disable-mask"></span>'),this.$cache.cont.addClass("irs-disabled")},removeDisableMask:function(){this.$cache.cont.remove(".irs-disable-mask"),this.$cache.cont.removeClass("irs-disabled")},remove:function(){this.$cache.cont.remove(),this.$cache.cont=null,this.$cache.line.off("keydown.irs_"+this.plugin_count),this.$cache.body.off("touchmove.irs_"+this.plugin_count),this.$cache.body.off("mousemove.irs_"+this.plugin_count),this.$cache.win.off("touchend.irs_"+this.plugin_count),this.$cache.win.off("mouseup.irs_"+this.plugin_count),e&&(this.$cache.body.off("mouseup.irs_"+this.plugin_count),this.$cache.body.off("mouseleave.irs_"+this.plugin_count)),this.$cache.grid_labels=[],this.coords.big=[],this.coords.big_w=[],this.coords.big_p=[],this.coords.big_x=[],cancelAnimationFrame(this.raf_id)},bindEvents:function(){this.no_diapason||(this.$cache.body.on("touchmove.irs_"+this.plugin_count,this.pointerMove.bind(this)),this.$cache.body.on("mousemove.irs_"+this.plugin_count,this.pointerMove.bind(this)),this.$cache.win.on("touchend.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.win.on("mouseup.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.line.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.line.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.line.on("focus.irs_"+this.plugin_count,this.pointerFocus.bind(this)),this.options.drag_interval&&"double"===this.options.type?(this.$cache.bar.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"both")),this.$cache.bar.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"both"))):(this.$cache.bar.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.bar.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))),"single"===this.options.type?(this.$cache.single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.s_single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.shad_single.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.s_single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.edge.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_single.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))):(this.$cache.single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,null)),this.$cache.single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,null)),this.$cache.from.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.s_from.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.to.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.s_to.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.shad_from.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_to.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.from.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.s_from.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.to.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.s_to.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.shad_from.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_to.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))),this.options.keyboard&&this.$cache.line.on("keydown.irs_"+this.plugin_count,this.key.bind(this,"keyboard")),e&&(this.$cache.body.on("mouseup.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.body.on("mouseleave.irs_"+this.plugin_count,this.pointerUp.bind(this))))},pointerFocus:function(t){if(!this.target){var i="single"===this.options.type?this.$cache.single:this.$cache.from;t=i.offset().left,t+=i.width()/2-1,this.pointerClick("single",{preventDefault:function(){},pageX:t})}},pointerMove:function(t){this.dragging&&(this.coords.x_pointer=(t.pageX||t.originalEvent.touches&&t.originalEvent.touches[0].pageX)-this.coords.x_gap,this.calc())},pointerUp:function(t){this.current_plugin===this.plugin_count&&this.is_active&&(this.is_active=!1,this.$cache.cont.find(".state_hover").removeClass("state_hover"),this.force_redraw=!0,e&&h("*").prop("unselectable",!1),this.updateScene(),this.restoreOriginalMinInterval(),(h.contains(this.$cache.cont[0],t.target)||this.dragging)&&this.callOnFinish(),this.dragging=!1)},pointerDown:function(t,i){i.preventDefault();var s=i.pageX||i.originalEvent.touches&&i.originalEvent.touches[0].pageX;2!==i.button&&("both"===t&&this.setTempMinInterval(),t=t||(this.target||"from"),this.current_plugin=this.plugin_count,this.target=t,this.dragging=this.is_active=!0,this.coords.x_gap=this.$cache.rs.offset().left,this.coords.x_pointer=s-this.coords.x_gap,this.calcPointerPercent(),this.changeLevel(t),e&&h("*").prop("unselectable",!0),this.$cache.line.trigger("focus"),this.updateScene())},pointerClick:function(t,i){i.preventDefault();var s=i.pageX||i.originalEvent.touches&&i.originalEvent.touches[0].pageX;2!==i.button&&(this.current_plugin=this.plugin_count,this.target=t,this.is_click=!0,this.coords.x_gap=this.$cache.rs.offset().left,this.coords.x_pointer=+(s-this.coords.x_gap).toFixed(),this.force_redraw=!0,this.calc(),this.$cache.line.trigger("focus"))},key:function(t,i){if(!(this.current_plugin!==this.plugin_count||i.altKey||i.ctrlKey||i.shiftKey||i.metaKey)){switch(i.which){case 83:case 65:case 40:case 37:i.preventDefault(),this.moveByKey(!1);break;case 87:case 68:case 38:case 39:i.preventDefault(),this.moveByKey(!0)}return!0}},moveByKey:function(t){var i=this.coords.p_pointer,s=(this.options.max-this.options.min)/100;s=this.options.step/s;this.coords.x_pointer=this.toFixed(this.coords.w_rs/100*(t?i+s:i-s)),this.is_key=!0,this.calc()},setMinMax:function(){if(this.options)if(this.options.hide_min_max)this.$cache.min[0].style.display="none",this.$cache.max[0].style.display="none";else{if(this.options.values.length)this.$cache.min.html(this.decorate(this.options.p_values[this.options.min])),this.$cache.max.html(this.decorate(this.options.p_values[this.options.max]));else{var t=this._prettify(this.options.min),i=this._prettify(this.options.max);this.result.min_pretty=t,this.result.max_pretty=i,this.$cache.min.html(this.decorate(t,this.options.min)),this.$cache.max.html(this.decorate(i,this.options.max))}this.labels.w_min=this.$cache.min.outerWidth(!1),this.labels.w_max=this.$cache.max.outerWidth(!1)}},setTempMinInterval:function(){var t=this.result.to-this.result.from;null===this.old_min_interval&&(this.old_min_interval=this.options.min_interval),this.options.min_interval=t},restoreOriginalMinInterval:function(){null!==this.old_min_interval&&(this.options.min_interval=this.old_min_interval,this.old_min_interval=null)},calc:function(t){if(this.options&&(this.calc_count++,10!==this.calc_count&&!t||(this.calc_count=0,this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.calcHandlePercent()),this.coords.w_rs)){switch(this.calcPointerPercent(),t=this.getHandleX(),"both"===this.target&&(this.coords.p_gap=0,t=this.getHandleX()),"click"===this.target&&(this.coords.p_gap=this.coords.p_handle/2,t=this.getHandleX(),this.target=this.options.drag_interval?"both_one":this.chooseHandle(t)),this.target){case"base":var i=(this.options.max-this.options.min)/100;t=(this.result.from-this.options.min)/i,i=(this.result.to-this.options.min)/i,this.coords.p_single_real=this.toFixed(t),this.coords.p_from_real=this.toFixed(t),this.coords.p_to_real=this.toFixed(i),this.coords.p_single_real=this.checkDiapason(this.coords.p_single_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_single_fake=this.convertToFakePercent(this.coords.p_single_real),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real),this.target=null;break;case"single":if(this.options.from_fixed)break;this.coords.p_single_real=this.convertToRealPercent(t),this.coords.p_single_real=this.calcWithStep(this.coords.p_single_real),this.coords.p_single_real=this.checkDiapason(this.coords.p_single_real,this.options.from_min,this.options.from_max),this.coords.p_single_fake=this.convertToFakePercent(this.coords.p_single_real);break;case"from":if(this.options.from_fixed)break;this.coords.p_from_real=this.convertToRealPercent(t),this.coords.p_from_real=this.calcWithStep(this.coords.p_from_real),this.coords.p_from_real>this.coords.p_to_real&&(this.coords.p_from_real=this.coords.p_to_real),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkMinInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_real=this.checkMaxInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real);break;case"to":if(this.options.to_fixed)break;this.coords.p_to_real=this.convertToRealPercent(t),this.coords.p_to_real=this.calcWithStep(this.coords.p_to_real),this.coords.p_to_real<this.coords.p_from_real&&(this.coords.p_to_real=this.coords.p_from_real),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_real=this.checkMinInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_real=this.checkMaxInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real);break;case"both":if(this.options.from_fixed||this.options.to_fixed)break;t=this.toFixed(t+.001*this.coords.p_handle),this.coords.p_from_real=this.convertToRealPercent(t)-this.coords.p_gap_left,this.coords.p_from_real=this.calcWithStep(this.coords.p_from_real),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkMinInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_real=this.convertToRealPercent(t)+this.coords.p_gap_right,this.coords.p_to_real=this.calcWithStep(this.coords.p_to_real),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_real=this.checkMinInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real);break;case"both_one":if(!this.options.from_fixed&&!this.options.to_fixed){var s=this.convertToRealPercent(t),o=(t=this.result.to_percent-this.result.from_percent)/2;i=s-o,s=s+o;i<0&&(s=(i=0)+t),100<s&&(i=(s=100)-t),this.coords.p_from_real=this.calcWithStep(i),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_real=this.calcWithStep(s),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real)}}"single"===this.options.type?(this.coords.p_bar_x=this.coords.p_handle/2,this.coords.p_bar_w=this.coords.p_single_fake,this.result.from_percent=this.coords.p_single_real,this.result.from=this.convertToValue(this.coords.p_single_real),this.result.from_pretty=this._prettify(this.result.from),this.options.values.length&&(this.result.from_value=this.options.values[this.result.from])):(this.coords.p_bar_x=this.toFixed(this.coords.p_from_fake+this.coords.p_handle/2),this.coords.p_bar_w=this.toFixed(this.coords.p_to_fake-this.coords.p_from_fake),this.result.from_percent=this.coords.p_from_real,this.result.from=this.convertToValue(this.coords.p_from_real),this.result.from_pretty=this._prettify(this.result.from),this.result.to_percent=this.coords.p_to_real,this.result.to=this.convertToValue(this.coords.p_to_real),this.result.to_pretty=this._prettify(this.result.to),this.options.values.length&&(this.result.from_value=this.options.values[this.result.from],this.result.to_value=this.options.values[this.result.to])),this.calcMinMax(),this.calcLabels()}},calcPointerPercent:function(){this.coords.w_rs?(this.coords.x_pointer<0||isNaN(this.coords.x_pointer)?this.coords.x_pointer=0:this.coords.x_pointer>this.coords.w_rs&&(this.coords.x_pointer=this.coords.w_rs),this.coords.p_pointer=this.toFixed(this.coords.x_pointer/this.coords.w_rs*100)):this.coords.p_pointer=0},convertToRealPercent:function(t){return t/(100-this.coords.p_handle)*100},convertToFakePercent:function(t){return t/100*(100-this.coords.p_handle)},getHandleX:function(){var t=100-this.coords.p_handle,i=this.toFixed(this.coords.p_pointer-this.coords.p_gap);return i<0?i=0:t<i&&(i=t),i},calcHandlePercent:function(){this.coords.w_handle="single"===this.options.type?this.$cache.s_single.outerWidth(!1):this.$cache.s_from.outerWidth(!1),this.coords.p_handle=this.toFixed(this.coords.w_handle/this.coords.w_rs*100)},chooseHandle:function(t){return"single"===this.options.type?"single":t>=this.coords.p_from_real+(this.coords.p_to_real-this.coords.p_from_real)/2?this.options.to_fixed?"from":"to":this.options.from_fixed?"to":"from"},calcMinMax:function(){this.coords.w_rs&&(this.labels.p_min=this.labels.w_min/this.coords.w_rs*100,this.labels.p_max=this.labels.w_max/this.coords.w_rs*100)},calcLabels:function(){this.coords.w_rs&&!this.options.hide_from_to&&("single"===this.options.type?(this.labels.w_single=this.$cache.single.outerWidth(!1),this.labels.p_single_fake=this.labels.w_single/this.coords.w_rs*100,this.labels.p_single_left=this.coords.p_single_fake+this.coords.p_handle/2-this.labels.p_single_fake/2):(this.labels.w_from=this.$cache.from.outerWidth(!1),this.labels.p_from_fake=this.labels.w_from/this.coords.w_rs*100,this.labels.p_from_left=this.coords.p_from_fake+this.coords.p_handle/2-this.labels.p_from_fake/2,this.labels.p_from_left=this.toFixed(this.labels.p_from_left),this.labels.p_from_left=this.checkEdges(this.labels.p_from_left,this.labels.p_from_fake),this.labels.w_to=this.$cache.to.outerWidth(!1),this.labels.p_to_fake=this.labels.w_to/this.coords.w_rs*100,this.labels.p_to_left=this.coords.p_to_fake+this.coords.p_handle/2-this.labels.p_to_fake/2,this.labels.p_to_left=this.toFixed(this.labels.p_to_left),this.labels.p_to_left=this.checkEdges(this.labels.p_to_left,this.labels.p_to_fake),this.labels.w_single=this.$cache.single.outerWidth(!1),this.labels.p_single_fake=this.labels.w_single/this.coords.w_rs*100,this.labels.p_single_left=(this.labels.p_from_left+this.labels.p_to_left+this.labels.p_to_fake)/2-this.labels.p_single_fake/2,this.labels.p_single_left=this.toFixed(this.labels.p_single_left)),this.labels.p_single_left=this.checkEdges(this.labels.p_single_left,this.labels.p_single_fake))},updateScene:function(){this.raf_id&&(cancelAnimationFrame(this.raf_id),this.raf_id=null),clearTimeout(this.update_tm),this.update_tm=null,this.options&&(this.drawHandles(),this.is_active?this.raf_id=requestAnimationFrame(this.updateScene.bind(this)):this.update_tm=setTimeout(this.updateScene.bind(this),300))},drawHandles:function(){this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.coords.w_rs&&(this.coords.w_rs!==this.coords.w_rs_old&&(this.target="base",this.is_resize=!0),this.coords.w_rs===this.coords.w_rs_old&&!this.force_redraw||(this.setMinMax(),this.calc(!0),this.drawLabels(),this.options.grid&&(this.calcGridMargin(),this.calcGridLabels()),this.force_redraw=!0,this.coords.w_rs_old=this.coords.w_rs,this.drawShadow()),this.coords.w_rs&&(this.dragging||this.force_redraw||this.is_key)&&((this.old_from!==this.result.from||this.old_to!==this.result.to||this.force_redraw||this.is_key)&&(this.drawLabels(),this.$cache.bar[0].style.left=this.coords.p_bar_x+"%",this.$cache.bar[0].style.width=this.coords.p_bar_w+"%","single"===this.options.type?this.$cache.s_single[0].style.left=this.coords.p_single_fake+"%":(this.$cache.s_from[0].style.left=this.coords.p_from_fake+"%",this.$cache.s_to[0].style.left=this.coords.p_to_fake+"%",this.old_from===this.result.from&&!this.force_redraw||(this.$cache.from[0].style.left=this.labels.p_from_left+"%"),this.old_to===this.result.to&&!this.force_redraw||(this.$cache.to[0].style.left=this.labels.p_to_left+"%")),this.$cache.single[0].style.left=this.labels.p_single_left+"%",this.writeToInput(),this.old_from===this.result.from&&this.old_to===this.result.to||this.is_start||(this.$cache.input.trigger("change"),this.$cache.input.trigger("input")),this.old_from=this.result.from,this.old_to=this.result.to,this.is_resize||this.is_update||this.is_start||this.is_finish||this.callOnChange(),(this.is_key||this.is_click)&&(this.is_click=this.is_key=!1,this.callOnFinish()),this.is_finish=this.is_resize=this.is_update=!1),this.force_redraw=this.is_click=this.is_key=this.is_start=!1))},drawLabels:function(){if(this.options){var t=this.options.values.length,i=this.options.p_values;if(!this.options.hide_from_to)if("single"===this.options.type){if(t)t=this.decorate(i[this.result.from]);else{var s=this._prettify(this.result.from);t=this.decorate(s,this.result.from)}this.$cache.single.html(t),this.calcLabels(),this.$cache.min[0].style.visibility=this.labels.p_single_left<this.labels.p_min+1?"hidden":"visible",this.$cache.max[0].style.visibility=this.labels.p_single_left+this.labels.p_single_fake>100-this.labels.p_max-1?"hidden":"visible"}else{i=t?(this.options.decorate_both?(t=this.decorate(i[this.result.from]),t+=this.options.values_separator,t+=this.decorate(i[this.result.to])):t=this.decorate(i[this.result.from]+this.options.values_separator+i[this.result.to]),s=this.decorate(i[this.result.from]),this.decorate(i[this.result.to])):(s=this._prettify(this.result.from),i=this._prettify(this.result.to),this.options.decorate_both?(t=this.decorate(s,this.result.from),t+=this.options.values_separator,t+=this.decorate(i,this.result.to)):t=this.decorate(s+this.options.values_separator+i,this.result.to),s=this.decorate(s,this.result.from),this.decorate(i,this.result.to)),this.$cache.single.html(t),this.$cache.from.html(s),this.$cache.to.html(i),this.calcLabels(),t=Math.min(this.labels.p_single_left,this.labels.p_from_left),s=this.labels.p_single_left+this.labels.p_single_fake;i=this.labels.p_to_left+this.labels.p_to_fake;var o=Math.max(s,i);this.labels.p_from_left+this.labels.p_from_fake>=this.labels.p_to_left?(this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.single[0].style.visibility="visible",o=this.result.from===this.result.to?("from"===this.target?this.$cache.from[0].style.visibility="visible":"to"===this.target?this.$cache.to[0].style.visibility="visible":this.target||(this.$cache.from[0].style.visibility="visible"),this.$cache.single[0].style.visibility="hidden",i):(this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.single[0].style.visibility="visible",Math.max(s,i))):(this.$cache.from[0].style.visibility="visible",this.$cache.to[0].style.visibility="visible",this.$cache.single[0].style.visibility="hidden"),this.$cache.min[0].style.visibility=t<this.labels.p_min+1?"hidden":"visible",this.$cache.max[0].style.visibility=o>100-this.labels.p_max-1?"hidden":"visible"}}},drawShadow:function(){var t=this.options,i=this.$cache,s="number"==typeof t.from_min&&!isNaN(t.from_min),o="number"==typeof t.from_max&&!isNaN(t.from_max),e="number"==typeof t.to_min&&!isNaN(t.to_min),h="number"==typeof t.to_max&&!isNaN(t.to_max);"single"===t.type?t.from_shadow&&(s||o)?(s=this.convertToPercent(s?t.from_min:t.min),o=this.convertToPercent(o?t.from_max:t.max)-s,s=this.toFixed(s-this.coords.p_handle/100*s),o=this.toFixed(o-this.coords.p_handle/100*o),s+=this.coords.p_handle/2,i.shad_single[0].style.display="block",i.shad_single[0].style.left=s+"%",i.shad_single[0].style.width=o+"%"):i.shad_single[0].style.display="none":(t.from_shadow&&(s||o)?(s=this.convertToPercent(s?t.from_min:t.min),o=this.convertToPercent(o?t.from_max:t.max)-s,s=this.toFixed(s-this.coords.p_handle/100*s),o=this.toFixed(o-this.coords.p_handle/100*o),s+=this.coords.p_handle/2,i.shad_from[0].style.display="block",i.shad_from[0].style.left=s+"%",i.shad_from[0].style.width=o+"%"):i.shad_from[0].style.display="none",t.to_shadow&&(e||h)?(e=this.convertToPercent(e?t.to_min:t.min),t=this.convertToPercent(h?t.to_max:t.max)-e,e=this.toFixed(e-this.coords.p_handle/100*e),t=this.toFixed(t-this.coords.p_handle/100*t),e+=this.coords.p_handle/2,i.shad_to[0].style.display="block",i.shad_to[0].style.left=e+"%",i.shad_to[0].style.width=t+"%"):i.shad_to[0].style.display="none")},writeToInput:function(){"single"===this.options.type?(this.options.values.length?this.$cache.input.prop("value",this.result.from_value):this.$cache.input.prop("value",this.result.from),this.$cache.input.data("from",this.result.from)):(this.options.values.length?this.$cache.input.prop("value",this.result.from_value+this.options.input_values_separator+this.result.to_value):this.$cache.input.prop("value",this.result.from+this.options.input_values_separator+this.result.to),this.$cache.input.data("from",this.result.from),this.$cache.input.data("to",this.result.to))},callOnStart:function(){this.writeToInput(),this.options.onStart&&"function"==typeof this.options.onStart&&(this.options.scope?this.options.onStart.call(this.options.scope,this.result):this.options.onStart(this.result))},callOnChange:function(){this.writeToInput(),this.options.onChange&&"function"==typeof this.options.onChange&&(this.options.scope?this.options.onChange.call(this.options.scope,this.result):this.options.onChange(this.result))},callOnFinish:function(){this.writeToInput(),this.options.onFinish&&"function"==typeof this.options.onFinish&&(this.options.scope?this.options.onFinish.call(this.options.scope,this.result):this.options.onFinish(this.result))},callOnUpdate:function(){this.writeToInput(),this.options.onUpdate&&"function"==typeof this.options.onUpdate&&(this.options.scope?this.options.onUpdate.call(this.options.scope,this.result):this.options.onUpdate(this.result))},toggleInput:function(){this.$cache.input.toggleClass("irs-hidden-input"),this.has_tab_index?this.$cache.input.prop("tabindex",-1):this.$cache.input.removeProp("tabindex"),this.has_tab_index=!this.has_tab_index},convertToPercent:function(t,i){var s=this.options.max-this.options.min;return s?this.toFixed((i?t:t-this.options.min)/(s/100)):(this.no_diapason=!0,0)},convertToValue:function(t){var i,s,o=this.options.min,e=this.options.max,h=o.toString().split(".")[1],r=e.toString().split(".")[1],n=0,a=0;return 0===t?this.options.min:100===t?this.options.max:(h&&(n=i=h.length),r&&(n=s=r.length),i&&s&&(n=s<=i?i:s),o<0&&(o=+(o+(a=Math.abs(o))).toFixed(n),e=+(e+a).toFixed(n)),t=(e-o)/100*t+o,t=(o=this.options.step.toString().split(".")[1])?+t.toFixed(o.length):(t/=this.options.step,+(t*=this.options.step).toFixed(0)),a&&(t-=a),(a=o?+t.toFixed(o.length):this.toFixed(t))<this.options.min?a=this.options.min:a>this.options.max&&(a=this.options.max),a)},calcWithStep:function(t){var i=Math.round(t/this.coords.p_step)*this.coords.p_step;return 100<i&&(i=100),100===t&&(i=100),this.toFixed(i)},checkMinInterval:function(t,i,s){var o=this.options;return o.min_interval?(t=this.convertToValue(t),i=this.convertToValue(i),"from"===s?i-t<o.min_interval&&(t=i-o.min_interval):t-i<o.min_interval&&(t=i+o.min_interval),this.convertToPercent(t)):t},checkMaxInterval:function(t,i,s){var o=this.options;return o.max_interval?(t=this.convertToValue(t),i=this.convertToValue(i),"from"===s?i-t>o.max_interval&&(t=i-o.max_interval):t-i>o.max_interval&&(t=i+o.max_interval),this.convertToPercent(t)):t},checkDiapason:function(t,i,s){t=this.convertToValue(t);var o=this.options;return"number"!=typeof i&&(i=o.min),"number"!=typeof s&&(s=o.max),t<i&&(t=i),s<t&&(t=s),this.convertToPercent(t)},toFixed:function(t){return+(t=t.toFixed(20))},_prettify:function(t){return this.options.prettify_enabled?this.options.prettify&&"function"==typeof this.options.prettify?this.options.prettify(t):this.prettify(t):t},prettify:function(t){return t.toString().replace(/(\d{1,3}(?=(?:\d\d\d)+(?!\d)))/g,"$1"+this.options.prettify_separator)},checkEdges:function(t,i){return this.options.force_edges&&(t<0?t=0:100-i<t&&(t=100-i)),this.toFixed(t)},validate:function(){var t,i=this.options,s=this.result,o=i.values,e=o.length;if("string"==typeof i.min&&(i.min=+i.min),"string"==typeof i.max&&(i.max=+i.max),"string"==typeof i.from&&(i.from=+i.from),"string"==typeof i.to&&(i.to=+i.to),"string"==typeof i.step&&(i.step=+i.step),"string"==typeof i.from_min&&(i.from_min=+i.from_min),"string"==typeof i.from_max&&(i.from_max=+i.from_max),"string"==typeof i.to_min&&(i.to_min=+i.to_min),"string"==typeof i.to_max&&(i.to_max=+i.to_max),"string"==typeof i.grid_num&&(i.grid_num=+i.grid_num),i.max<i.min&&(i.max=i.min),e)for(i.p_values=[],i.min=0,i.max=e-1,i.step=1,i.grid_num=i.max,i.grid_snap=!0,t=0;t<e;t++){var h=+o[t];h=isNaN(h)?o[t]:(o[t]=h,this._prettify(h)),i.p_values.push(h)}"number"==typeof i.from&&!isNaN(i.from)||(i.from=i.min),"number"==typeof i.to&&!isNaN(i.to)||(i.to=i.max),"single"===i.type?(i.from<i.min&&(i.from=i.min),i.from>i.max&&(i.from=i.max)):(i.from<i.min&&(i.from=i.min),i.from>i.max&&(i.from=i.max),i.to<i.min&&(i.to=i.min),i.to>i.max&&(i.to=i.max),this.update_check.from&&(this.update_check.from!==i.from&&i.from>i.to&&(i.from=i.to),this.update_check.to!==i.to&&i.to<i.from&&(i.to=i.from)),i.from>i.to&&(i.from=i.to),i.to<i.from&&(i.to=i.from)),("number"!=typeof i.step||isNaN(i.step)||!i.step||i.step<0)&&(i.step=1),"number"==typeof i.from_min&&i.from<i.from_min&&(i.from=i.from_min),"number"==typeof i.from_max&&i.from>i.from_max&&(i.from=i.from_max),"number"==typeof i.to_min&&i.to<i.to_min&&(i.to=i.to_min),"number"==typeof i.to_max&&i.from>i.to_max&&(i.to=i.to_max),s&&(s.min!==i.min&&(s.min=i.min),s.max!==i.max&&(s.max=i.max),(s.from<s.min||s.from>s.max)&&(s.from=i.from),(s.to<s.min||s.to>s.max)&&(s.to=i.to)),("number"!=typeof i.min_interval||isNaN(i.min_interval)||!i.min_interval||i.min_interval<0)&&(i.min_interval=0),("number"!=typeof i.max_interval||isNaN(i.max_interval)||!i.max_interval||i.max_interval<0)&&(i.max_interval=0),i.min_interval&&i.min_interval>i.max-i.min&&(i.min_interval=i.max-i.min),i.max_interval&&i.max_interval>i.max-i.min&&(i.max_interval=i.max-i.min)},decorate:function(t,i){var s="",o=this.options;return o.prefix&&(s+=o.prefix),s+=t,o.max_postfix&&(o.values.length&&t===o.p_values[o.max]?(s+=o.max_postfix,o.postfix&&(s+=" ")):i===o.max&&(s+=o.max_postfix,o.postfix&&(s+=" "))),o.postfix&&(s+=o.postfix),s},updateFrom:function(){this.result.from=this.options.from,this.result.from_percent=this.convertToPercent(this.result.from),this.result.from_pretty=this._prettify(this.result.from),this.options.values&&(this.result.from_value=this.options.values[this.result.from])},updateTo:function(){this.result.to=this.options.to,this.result.to_percent=this.convertToPercent(this.result.to),this.result.to_pretty=this._prettify(this.result.to),this.options.values&&(this.result.to_value=this.options.values[this.result.to])},updateResult:function(){this.result.min=this.options.min,this.result.max=this.options.max,this.updateFrom(),this.updateTo()},appendGrid:function(){if(this.options.grid){var t,i=this.options,s=i.max-i.min,o=i.grid_num,e=4,h="";if(this.calcGridMargin(),i.grid_snap)if(50<s){o=50/i.step;var r=this.toFixed(i.step/.5)}else o=s/i.step,r=this.toFixed(i.step/(s/100));else r=this.toFixed(100/o);for(4<o&&(e=3),7<o&&(e=2),14<o&&(e=1),28<o&&(e=0),s=0;s<o+1;s++){var n=e,a=this.toFixed(r*s);100<a&&(a=100);var c=((this.coords.big[s]=a)-r*(s-1))/(n+1);for(t=1;t<=n&&0!==a;t++){h+='<span class="irs-grid-pol small" style="left: '+this.toFixed(a-c*t)+'%"></span>'}h+='<span class="irs-grid-pol" style="left: '+a+'%"></span>',t=this.convertToValue(a),h+='<span class="irs-grid-text js-grid-text-'+s+'" style="left: '+a+'%">'+(t=i.values.length?i.p_values[t]:this._prettify(t))+"</span>"}this.coords.big_num=Math.ceil(o+1),this.$cache.cont.addClass("irs-with-grid"),this.$cache.grid.html(h),this.cacheGridLabels()}},cacheGridLabels:function(){var t,i=this.coords.big_num;for(t=0;t<i;t++){var s=this.$cache.grid.find(".js-grid-text-"+t);this.$cache.grid_labels.push(s)}this.calcGridLabels()},calcGridLabels:function(){var t,i=[],s=[],o=this.coords.big_num;for(t=0;t<o;t++)this.coords.big_w[t]=this.$cache.grid_labels[t].outerWidth(!1),this.coords.big_p[t]=this.toFixed(this.coords.big_w[t]/this.coords.w_rs*100),this.coords.big_x[t]=this.toFixed(this.coords.big_p[t]/2),i[t]=this.toFixed(this.coords.big[t]-this.coords.big_x[t]),s[t]=this.toFixed(i[t]+this.coords.big_p[t]);for(this.options.force_edges&&(i[0]<-this.coords.grid_gap&&(i[0]=-this.coords.grid_gap,s[0]=this.toFixed(i[0]+this.coords.big_p[0]),this.coords.big_x[0]=this.coords.grid_gap),s[o-1]>100+this.coords.grid_gap&&(s[o-1]=100+this.coords.grid_gap,i[o-1]=this.toFixed(s[o-1]-this.coords.big_p[o-1]),this.coords.big_x[o-1]=this.toFixed(this.coords.big_p[o-1]-this.coords.grid_gap))),this.calcGridCollision(2,i,s),this.calcGridCollision(4,i,s),t=0;t<o;t++)i=this.$cache.grid_labels[t][0],this.coords.big_x[t]!==Number.POSITIVE_INFINITY&&(i.style.marginLeft=-this.coords.big_x[t]+"%")},calcGridCollision:function(t,i,s){var o,e=this.coords.big_num;for(o=0;o<e;o+=t){var h=o+t/2;if(e<=h)break;this.$cache.grid_labels[h][0].style.visibility=s[o]<=i[h]?"visible":"hidden"}},calcGridMargin:function(){this.options.grid_margin&&(this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.coords.w_rs&&(this.coords.w_handle="single"===this.options.type?this.$cache.s_single.outerWidth(!1):this.$cache.s_from.outerWidth(!1),this.coords.p_handle=this.toFixed(this.coords.w_handle/this.coords.w_rs*100),this.coords.grid_gap=this.toFixed(this.coords.p_handle/2-.1),this.$cache.grid[0].style.width=this.toFixed(100-this.coords.p_handle)+"%",this.$cache.grid[0].style.left=this.coords.grid_gap+"%"))},update:function(t){this.input&&(this.is_update=!0,this.options.from=this.result.from,this.options.to=this.result.to,this.update_check.from=this.result.from,this.update_check.to=this.result.to,this.options=h.extend(this.options,t),this.validate(),this.updateResult(t),this.toggleInput(),this.remove(),this.init(!0))},reset:function(){this.input&&(this.updateResult(),this.update())},destroy:function(){this.input&&(this.toggleInput(),this.$cache.input.prop("readonly",!1),h.data(this.input,"ionRangeSlider",null),this.remove(),this.options=this.input=null)}},h.fn.ionRangeSlider=function(t){return this.each(function(){h.data(this,"ionRangeSlider")||h.data(this,"ionRangeSlider",new c(this,t,o++))})},function(){for(var h=0,t=["ms","moz","webkit","o"],i=0;i<t.length&&!n.requestAnimationFrame;++i)n.requestAnimationFrame=n[t[i]+"RequestAnimationFrame"],n.cancelAnimationFrame=n[t[i]+"CancelAnimationFrame"]||n[t[i]+"CancelRequestAnimationFrame"];n.requestAnimationFrame||(n.requestAnimationFrame=function(t,i){var s=(new Date).getTime(),o=Math.max(0,16-(s-h)),e=n.setTimeout(function(){t(s+o)},o);return h=s+o,e}),n.cancelAnimationFrame||(n.cancelAnimationFrame=function(t){clearTimeout(t)})}()});

/*!
 * imagesLoaded PACKAGED v5.0.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */
!function(t,e){"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,(function(){function t(){}let e=t.prototype;return e.on=function(t,e){if(!t||!e)return this;let i=this._events=this._events||{},s=i[t]=i[t]||[];return s.includes(e)||s.push(e),this},e.once=function(t,e){if(!t||!e)return this;this.on(t,e);let i=this._onceEvents=this._onceEvents||{};return(i[t]=i[t]||{})[e]=!0,this},e.off=function(t,e){let i=this._events&&this._events[t];if(!i||!i.length)return this;let s=i.indexOf(e);return-1!=s&&i.splice(s,1),this},e.emitEvent=function(t,e){let i=this._events&&this._events[t];if(!i||!i.length)return this;i=i.slice(0),e=e||[];let s=this._onceEvents&&this._onceEvents[t];for(let n of i){s&&s[n]&&(this.off(t,n),delete s[n]),n.apply(this,e)}return this},e.allOff=function(){return delete this._events,delete this._onceEvents,this},t})),
/*!
 * imagesLoaded v5.0.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */
function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}("undefined"!=typeof window?window:this,(function(t,e){let i=t.jQuery,s=t.console;function n(t,e,o){if(!(this instanceof n))return new n(t,e,o);let r=t;var h;("string"==typeof t&&(r=document.querySelectorAll(t)),r)?(this.elements=(h=r,Array.isArray(h)?h:"object"==typeof h&&"number"==typeof h.length?[...h]:[h]),this.options={},"function"==typeof e?o=e:Object.assign(this.options,e),o&&this.on("always",o),this.getImages(),i&&(this.jqDeferred=new i.Deferred),setTimeout(this.check.bind(this))):s.error(`Bad element for imagesLoaded ${r||t}`)}n.prototype=Object.create(e.prototype),n.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)};const o=[1,9,11];n.prototype.addElementImages=function(t){"IMG"===t.nodeName&&this.addImage(t),!0===this.options.background&&this.addElementBackgroundImages(t);let{nodeType:e}=t;if(!e||!o.includes(e))return;let i=t.querySelectorAll("img");for(let t of i)this.addImage(t);if("string"==typeof this.options.background){let e=t.querySelectorAll(this.options.background);for(let t of e)this.addElementBackgroundImages(t)}};const r=/url\((['"])?(.*?)\1\)/gi;function h(t){this.img=t}function d(t,e){this.url=t,this.element=e,this.img=new Image}return n.prototype.addElementBackgroundImages=function(t){let e=getComputedStyle(t);if(!e)return;let i=r.exec(e.backgroundImage);for(;null!==i;){let s=i&&i[2];s&&this.addBackground(s,t),i=r.exec(e.backgroundImage)}},n.prototype.addImage=function(t){let e=new h(t);this.images.push(e)},n.prototype.addBackground=function(t,e){let i=new d(t,e);this.images.push(i)},n.prototype.check=function(){if(this.progressedCount=0,this.hasAnyBroken=!1,!this.images.length)return void this.complete();let t=(t,e,i)=>{setTimeout((()=>{this.progress(t,e,i)}))};this.images.forEach((function(e){e.once("progress",t),e.check()}))},n.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount===this.images.length&&this.complete(),this.options.debug&&s&&s.log(`progress: ${i}`,t,e)},n.prototype.complete=function(){let t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){let t=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[t](this)}},h.prototype=Object.create(e.prototype),h.prototype.check=function(){this.getIsImageComplete()?this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.img.crossOrigin&&(this.proxyImage.crossOrigin=this.img.crossOrigin),this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.proxyImage.src=this.img.currentSrc||this.img.src)},h.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},h.prototype.confirm=function(t,e){this.isLoaded=t;let{parentNode:i}=this.img,s="PICTURE"===i.nodeName?i:this.img;this.emitEvent("progress",[this,s,e])},h.prototype.handleEvent=function(t){let e="on"+t.type;this[e]&&this[e](t)},h.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},h.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},h.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},d.prototype=Object.create(h.prototype),d.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url,this.getIsImageComplete()&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},d.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},d.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},n.makeJQueryPlugin=function(e){(e=e||t.jQuery)&&(i=e,i.fn.imagesLoaded=function(t,e){return new n(this,t,e).jqDeferred.promise(i(this))})},n.makeJQueryPlugin(),n}));

(function($) {
    "use strict";

    if ( typeof prdctfltr == "undefined" ) {
        console.log("Error. Product Filter JS variable not found.");
        return false;
    }

    function prdctfltr_sort_classes() {
        if (prdctfltr.ajax_class === '') {
            prdctfltr.ajax_class = '.products';
        }
        if (prdctfltr.ajax_category_class === '') {
            prdctfltr.ajax_category_class = '.product-category';
        }
        if (prdctfltr.ajax_product_class === '') {
            prdctfltr.ajax_product_class = '.type-product';
        }
        if (prdctfltr.ajax_pagination_class === '') {
            prdctfltr.ajax_pagination_class = '.woocommerce-pagination';
        }
        if (prdctfltr.ajax_count_class === '') {
            prdctfltr.ajax_count_class = '.woocommerce-result-count';
        }
        if (prdctfltr.ajax_orderby_class === '') {
            prdctfltr.ajax_orderby_class = '.woocommerce-ordering';
        }
    }
    prdctfltr_sort_classes();

    function mobile() {
        var css = '';
        $('.prdctfltr_mobile').each(function() {
            var id = $(this).prev().attr('data-id');
            css += '@media screen and (min-width: ' + $(this).prev().attr('data-mobile') + 'px) {.prdctfltr_wc[data-id="' + id + '"] {display:block;}.prdctfltr_wc[data-id="' + id + '"] + .prdctfltr_mobile {display:none;}}@media screen and (max-width: ' + $(this).prev().attr('data-mobile') + 'px) {.prdctfltr_wc[data-id="' + id + '"] {display:none;}.prdctfltr_wc[data-id="' + id + '"] +.prdctfltr_mobile {display:block;}}';
        });

        $('.prdctfltr_mobile_show').each(function() {
            var id = $(this).attr('data-id');
            css += '@media screen and (min-width: ' + $(this).attr('data-mobile') + 'px) {.prdctfltr_wc[data-id="' + id + '"] {display:block;}}';
        });

        $('.prdctfltr_mobile_hide').each(function() {
            var id = $(this).attr('data-id');
            css += '@media screen and (min-width: ' + $(this).attr('data-mobile') + 'px) {.prdctfltr_wc[data-id="' + id + '"] {display:none;}}>';
        });

        $('head').append('<style type="text/css">' + css + '</style>');
    }
    mobile();

    var pf_singlesc = false;
    if ($('.prdctfltr_sc_products.prdctfltr_ajax ' + prdctfltr.ajax_class).length == 1 && $('.prdctfltr_wc:not(.prdctfltr_step_filter)').length > 0) {
        $('body').addClass('prdctfltr-sc');
        pf_singlesc = 1;
    } else {
        prdctfltr.active_sc = '';
    }

    var pf_failsafe = false;

    function ajax_failsafe() {
        if (prdctfltr.ajax_failsafe.length == 0) {
            return false;
        }
        if ($('.prdctfltr_sc_products').length > 0) {
            return false;
        }
        if ($('body').hasClass('prdctfltr-ajax')) {
            pf_failsafe = false;
            if ($.inArray('wrapper', prdctfltr.ajax_failsafe) !== -1) {
                if ($(prdctfltr.ajax_class).length < 1) {
                    pf_failsafe = true;
                }
            }
            if ($.inArray('product', prdctfltr.ajax_failsafe) !== -1) {
                if ($(prdctfltr.ajax_class + ' ' + prdctfltr.ajax_product_class).length < 1 && $(prdctfltr.ajax_class + ' ' + prdctfltr.ajax_category_class).length < 1) {
                    pf_failsafe = true;
                }
            }

            if ($.inArray('pagination', prdctfltr.ajax_failsafe) !== -1) {
                if ($(prdctfltr.ajax_pagination_class).length < 1) {
                    pf_failsafe = true;
                }
            }

            if (pf_failsafe === true) {
                console.log('PF: AJAX Failsafe active.');
            }
        }
    }
    ajax_failsafe();

    prdctfltr.clearall = ($.isArray(prdctfltr.clearall) === true ? prdctfltr.clearall : false);

    var archiveAjax = false;
    if ($('body').hasClass('prdctfltr-ajax') && pf_failsafe === false) {
        archiveAjax = true;
    }

    if (archiveAjax === true || pf_singlesc) {
        var makeHistory = {};
        var pageFilters = {
            product_filter: [],
        };

        $('.prdctfltr_wc').each(function() {
            pageFilters.product_filter.push({
                id : $(this).attr('data-id'),
                filter : $("<div />").append($(this).clone()).html(),
            });
        });

        if (prdctfltr.rangefilters) {
            pageFilters.ranges = prdctfltr.rangefilters;
        }

        pageFilters.products = $("<div />").append($(prdctfltr.ajax_class).clone()).html();
        pageFilters.pagination = $("<div />").append($(prdctfltr.ajax_pagination_class).clone()).html();
        pageFilters.count = $("<div />").append($(prdctfltr.ajax_count_class).clone()).html();
        pageFilters.orderby = $("<div />").append($(prdctfltr.ajax_orderby_class).clone()).html();
        pageFilters.title = $("<div />").append($('h1.page-title').clone()).html();
        pageFilters.desc = $("<div />").append($('.term-description:first, .page-description:first').clone()).html();
        pageFilters.loop_start = $('<ul class="products">');
        pageFilters.prdctfltr = prdctfltr;

        var historyId = guid();

        makeHistory[historyId] = pageFilters;
        history.replaceState({ filters: historyId, archiveAjax: true, shortcodeAjax: false }, document.title, '');
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    var ajaxActive = false;

    $.expr[':'].Contains = function(a, i, m) {
        return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    String.prototype.getValueByKey = function(k) {
        var p = new RegExp('\\b' + k + '\\b', 'gi');
        return this.search(p) != -1 ? decodeURIComponent(this.substring(this.search(p) + k.length + 1).substring(0, this.substring(this.search(p) + k.length + 1).search(/(&|;|$)/))) : "";
    };

    var startInit = false;

    function __call_meta_range(i, obj3) {

        var currTax = $('#' + i).attr('data-filter');

        obj3.prettify_enabled = false;

        if (u(obj3.prettyValues)) {
            obj3.prettify_enabled = true;

            obj3.prettify = function(num) {
                return obj3.prettyValues[num];
            };
        }

        obj3.onChange = function(data) {
            startInit = true;
        };

        obj3.onFinish = function(data) {
            if (startInit === true) {

                startInit = false;

                var iValue = '';

                if (data.min == data.from && data.max == data.to) {

                    var ourObj = prdctfltr_get_obj_580($('#' + i).closest('.prdctfltr_wc'));

                    $.each(ourObj, function(i, obj) {

                        $(obj).find('input[name="' + currTax + '"]').val('');
                        $(obj).find('.prdctfltr_range input[data-filter="' + currTax + '"]:not(#' + i + ')').each(function() {
                            var range = $(this).data("ionRangeSlider");
                            range.update({
                                from: data.min,
                                to: data.max
                            });
                        });

                    });

                    $('#' + i).closest('.prdctfltr_filter').find('input[name="' + currTax + '"]:first').trigger('change');

                } else {

                    if (obj3.prettify_enabled === true) {
                        $.each(obj3.prettyValues.slice(data.from, data.to + 1), function(i, e) {
                            iValue += (i == 0 ? '' : ',') + $(obj3.prettyValues[data.from + i]).text();
                        })

                    } else {
                        iValue = data.from + ',' + data.to;
                    }

                    var ourObj = prdctfltr_get_obj_580($('#' + i).closest('.prdctfltr_wc'));

                    $.each(ourObj, function(i, obj) {

                        $(obj).find('input[name="' + currTax + '"]').val(iValue);

                        $(obj).find('.prdctfltr_range input[data-filter="' + currTax + '"]:not(#' + i + ')').each(function() {
                            var range = $(this).data("ionRangeSlider");

                            if (typeof range !== 'undefined') {
                                range.update({
                                    from: data.from,
                                    to: data.to
                                });
                            }

                        });

                    });

                    $('#' + i).closest('.prdctfltr_filter').find('input[name="' + currTax + '"]:first').trigger('change');

                }

                var curr_filter = $('#' + i).closest('.prdctfltr_wc');

                if (curr_filter.hasClass('prdctfltr_tabbed_selection') && curr_filter.hasClass('prdctfltr_click')) {
                    curr_filter.find('.prdctfltr_filter').each(function() {
                        if ($(this).find('input[type="hidden"]:first').length > 0 && $(this).find('input[type="hidden"]:first').val() !== '') {
                            if (!$(this).hasClass('prdctfltr_has_selection')) {
                                $(this).addClass('prdctfltr_has_selection');
                            }

                        } else {
                            if ($(this).hasClass('prdctfltr_has_selection')) {
                                $(this).removeClass('prdctfltr_has_selection');
                            }
                        }
                    });
                }

                var ourObj = prdctfltr_get_obj_580(curr_filter);

                $.each(ourObj, function(i, obj) {
                    var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + currTax + '"]');
                    pfObj.each(function() {
                        check_selection_boxes($(this), 'look');
                    });
                });

            }
        };

        $('#' + i).ionRangeSlider(obj3);
        ranges[i] = $('#' + i).data('ionRangeSlider');

    }

    function __call_taxonomy_range(i, obj3) {

        var currTax = $('#' + i).attr('data-filter');

        if (currTax !== 'price') {
            obj3.prettify_enabled = true;

            obj3.prettify = function(num) {
                return obj3.prettyValues[num];
            };
        }

        obj3.onChange = function(data) {
            startInit = true;
        };

        obj3.onFinish = function(data) {
            if (startInit === true) {

                startInit = false;

                if (data.min == data.from && data.max == data.to) {

                    var ourObj = prdctfltr_get_obj_580($('#' + i).closest('.prdctfltr_wc'));

                    $.each(ourObj, function(i, obj) {

                        $(obj).find('input[name="rng_min_' + currTax + '"]').val('');
                        $(obj).find('input[name="rng_max_' + currTax + '"]').val('');
                        $(obj).find('.prdctfltr_range input[data-filter="' + currTax + '"]:not(#' + i + ')').each(function() {
                            var range = $(this).data("ionRangeSlider");
                            range.update({
                                from: data.min,
                                to: data.max
                            });
                        });

                    });

                    $('#' + i).closest('.prdctfltr_filter').find('input[name="rng_max_' + currTax + '"]:first').trigger('change');


                } else {

                    var minVal = (currTax === 'price' ?
                        data.from :
                        $(obj3.prettyValues[data.from]).text());

                    var maxVal = (currTax === 'price' ?
                        data.to :
                        $(obj3.prettyValues[data.to]).text());

                    var ourObj = prdctfltr_get_obj_580($('#' + i).closest('.prdctfltr_wc'));

                    $.each(ourObj, function(i, obj) {

                        $(obj).find('input[name="rng_min_' + currTax + '"]').val(minVal);
                        $(obj).find('input[name="rng_max_' + currTax + '"]').val(maxVal);

                        $(obj).find('.prdctfltr_range input[data-filter="' + currTax + '"]:not(#' + i + ')').each(function() {
                            var range = $(this).data("ionRangeSlider");

                            if (typeof range !== 'undefined') {
                                range.update({
                                    from: data.from,
                                    to: data.to
                                });
                            }

                        });

                    });

                    $('#' + i).closest('.prdctfltr_filter').find('input[name="rng_max_' + currTax + '"]:first').trigger('change');

                }

                var curr_filter = $('#' + i).closest('.prdctfltr_wc');
                if (curr_filter.hasClass('prdctfltr_tabbed_selection') && curr_filter.hasClass('prdctfltr_click')) {
                    curr_filter.find('.prdctfltr_filter').each(function() {
                        if ($(this).find('input[type="hidden"]:first').length > 0 && $(this).find('input[type="hidden"]:first').val() !== '') {
                            if (!$(this).hasClass('prdctfltr_has_selection')) {
                                $(this).addClass('prdctfltr_has_selection');
                            }

                        } else {
                            if ($(this).hasClass('prdctfltr_has_selection')) {
                                $(this).removeClass('prdctfltr_has_selection');
                            }
                        }
                    });
                }

                var ourObj = prdctfltr_get_obj_580(curr_filter);

                $.each(ourObj, function(i, obj) {
                    var pfObj = $(obj).find('.prdctfltr_filter[data-filter="rng_' + currTax + '"]');
                    pfObj.each(function() {
                        check_selection_boxes($(this), 'look');
                    });
                });

            }
        };

        $('#' + i).ionRangeSlider(obj3);
        ranges[i] = $('#' + i).data('ionRangeSlider');

    }

    function init_ranges() {
        $.each(prdctfltr.rangefilters, function(i, obj3) {

            if ($('#' + i).length > 0) {
                if ($('#' + i).closest('.prdctfltr_filter').hasClass('prdctfltr_meta_range')) {
                    __call_meta_range(i, obj3);
                } else {
                    __call_taxonomy_range(i, obj3);
                }
            }
        });
    }

    var ranges = {};
    init_ranges();

    function reorder_selected(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        if (curr.find('label.prdctfltr_active').length == 0) {
            return;
        }
        
        curr.each(function() {
            if ($(this).hasClass('prdctfltr_selected_reorder')) {
                $(this).find('.prdctfltr_filter.prdctfltr_attributes .prdctfltr_checkboxes, .prdctfltr_filter.prdctfltr_vendor .prdctfltr_checkboxes, .prdctfltr_filter.prdctfltr_byprice .prdctfltr_checkboxes, .prdctfltr_filter.prdctfltr_orderby .prdctfltr_checkboxes').each(function() {
                    var checkboxes = $(this);
                    if (checkboxes.find('label.prdctfltr_active').length > 0) {
                        $(checkboxes.find('label.prdctfltr_active').get().reverse()).each(function() {
                            var addThis = $(this);
                            $(this).remove();
                            if (checkboxes.find('label.prdctfltr_ft_none:first').length > 0) {
                                checkboxes.find('label.prdctfltr_ft_none:first').after(addThis);
                            } else {
                                checkboxes.prepend(addThis);
                            }
                        });
                    }
                });
            }
        });
    }
    reorder_selected();

    function reorder_adoptive(curr) {

        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each(function() {

            var currEl = $(this);

            if ($(this).hasClass('prdctfltr_adoptive_reorder')) {
                currEl.find('.prdctfltr_adoptive').each(function() {
                    var filter = $(this);
                    if (filter.find('.pf_adoptive_hide').length > 0) {
                        var checkboxes = filter.find('.prdctfltr_checkboxes');
                        filter.find('.pf_adoptive_hide').each(function() {
                            var addThis = $(this);
                            $(this).remove();
                            checkboxes.append(addThis);
                        });
                    }
                });
            }

        });

    }
    reorder_adoptive();

    $(document).on('click', '.pf_more:not(.pf_activated)', function() {
        var filter = $(this).closest('.prdctfltr_attributes, .prdctfltr_meta');
        var checkboxes = filter.find('.prdctfltr_checkboxes');

        if (filter.hasClass('pf_adptv_default')) {
            var searchIn = 'label:not(.pf_adoptive_hide)';
        } else {
            var searchIn = 'label';
        }

        var displayType = checkboxes.find(searchIn + ':first').css('display');

        checkboxes.find(searchIn).attr('style', 'display:' + displayType + ' !important');
        checkboxes.find('.pf_more').addClass('pf_activated').html('<span>' + prdctfltr.localization.show_less + '</span>');

        __check_masonry(filter.closest('.prdctfltr_wc'));
    });

    $(document).on('click', '.pf_more.pf_activated', function() {
        var filter = $(this).closest('.prdctfltr_attributes, .prdctfltr_meta');
        var checkboxes = filter.find('.prdctfltr_checkboxes');

        if (filter.hasClass('pf_adptv_default')) {
            var searchIn = 'label:not(.pf_adoptive_hide)';
        } else {
            var searchIn = 'label';
        }
        checkboxes.each(function() {
            var max = parseInt(filter.attr('data-limit'), 10);
            if (max > 0 && $(this).find(searchIn).length > max ) {

                $(this).find(searchIn).slice(max).attr('style', 'display:none !important');
                $(this).find('.pf_more').html('<span>' + prdctfltr.localization.show_more + '</span>').removeClass('pf_activated');

                __check_masonry(filter.closest('.prdctfltr_wc'));
            }
        });
    });

    function set_select_index(curr) {

        curr = (curr == null ? $('.prdctfltr_woocommerce') : curr);

        curr.each(function() {

            var curr_el = $(this);

            var selects = curr_el.find('.pf_select .prdctfltr_filter');
            if (selects.length > 0) {
                var zIndex = selects.length;
                selects.each(function() {
                    $(this).css({ 'z-index': zIndex });
                    zIndex--;
                });
            }
        });

    }
    set_select_index();

    function init_search(curr) {

        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each(function() {
            var curr_el = $(this);

            curr_el.find('input.pf_search').each(function() {
                if ($(this).val() !== '') {
                    $(this).next().show();
                }

                $(this).on('keyup', function() {
                    if ( $(this).val() === '' ) {
                        $(this).next().hide();
                    } else if ($(this).next().is(':hidden')) {
                        $(this).next().show();
                    }
                });
            });
        });
    }
    init_search();

    $(document).on('keydown', '.pf_search', function(e) {
        if (e.key === 'Enter') {
            $(this).next().trigger('click');
            return false;
        }
    });

    $(document).on('click', '.pf_search_trigger', function() {
        if (ajaxActive === true) {
            return false;
        }
        
        var wc = $(this).closest('.prdctfltr_wc');

        if ($(this).prev().val() === '') {
            $('.prdctfltr_filter input[name="s"], .prdctfltr_add_inputs input[name="s"]').remove();
        }

        if (!wc.hasClass('prdctfltr_click_filter')) {
            wc.find('.prdctfltr_woocommerce_filter_submit').trigger('click');
        } else {
            var obj = wc.find('.prdctfltr_woocommerce_ordering');
            prdctfltr_respond_550(obj);
        }

        return false;
    });


    function is_touch_device() {
        return 'ontouchstart' in window || navigator.maxTouchPoints;
    }

    function prdctfltr_init_tooltips(c) {

        if (is_touch_device() !== true) {

            c = (c == null ? $('.prdctfltr_woocommerce') : c);

            c.each(function() {

                var $tooltips = $(this).find('.prdctfltr_filter :not(.prdctfltr_terms_customized_select) label');

                $tooltips.each(function() {

                    var $l = $(this);
                    var $t = $l.find('.prdctfltr_tooltip');

                    if ($t.length > 0) {

                        var f = {

                            timeout: 150,

                            over: function() {
                                if ($('body > .pf_fixtooltip').length > 0) {
                                    $('body > .pf_fixtooltip').remove();
                                }

                                var p = getCoords($l);

                                $('body').append('<div class="pf_fixtooltip" style="z-index:999999;position:fixed;top:' + p.top + 'px;left:' + (p.left + $l.width() / 2) + 'px;">' + $('<div></div>').append($t.clone()).html() + '</div>');

                                setTimeout(function() {
                                    $('body > .pf_fixtooltip').addClass('prdctfltr_hover');
                                }, 10);

                            },

                            out: function() {

                                $('body > .prdctfltr_hover').removeClass('prdctfltr_hover').addClass('prdctfltr_removeme');

                                setTimeout(function() {
                                    $('body > .prdctfltr_removeme').remove();
                                }, 150);

                            },

                        };

                        $l.hoverIntent(f);

                    }

                });

            });

        }

    }
    prdctfltr_init_tooltips();

    function getCoords(elem) {
        var box = elem[0].getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top = box.top - clientTop;
        var left = box.left - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }

    function prdctfltr_cats_mode_700(curr) {

        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each(function(i, obj) {

            obj = $(obj);
            var checkFilters = obj.find('.prdctfltr_attributes');

            checkFilters.each(function() {

                var mode = false;

                if ($(this).hasClass('prdctfltr_drill')) {
                    mode = 'drill';
                }
                if ($(this).hasClass('prdctfltr_drillback')) {
                    mode = 'drillback';
                }
                if ($(this).hasClass('prdctfltr_subonly')) {
                    mode = 'subonly';
                }
                if ($(this).hasClass('prdctfltr_subonlyback')) {
                    mode = 'subonlyback';
                }
                if (mode === false) {
                    return true;
                }

                var doIt = true;
                var checkCheckboxes = $(this).find('.prdctfltr_checkboxes');

                if (mode === 'subonly' || mode === 'subonlyback') {
                    if (checkCheckboxes.find('label.prdctfltr_active').length > 1) {
                        if (checkCheckboxes.find('> label.prdctfltr_active').length > 1) {
                            doIt = false;
                        }
                        var checkParents = '';
                        checkCheckboxes.find('label.prdctfltr_active input[type="checkbox"]').each(function() {
                            if (checkParents === '') {
                                checkParents = ($(this).attr('data-parent') ? $(this).attr('data-parent') : '%toplevel');
                            } else {
                                if ($(this).attr('data-parent') !== checkParents) {
                                    doIt = false;
                                }
                            }
                        });

                    }
                }

                if (doIt === false) {
                    return;
                }

                var ourEl = checkCheckboxes.find('label.prdctfltr_active');

                if (ourEl.length == 0) {
                    if (mode === 'drill' || mode === 'drillback') {
                        checkCheckboxes.find('> .prdctfltr_sub').remove();
                    }
                } else {
                    ourEl.each(function() {

                        if ($(this).next().is('.prdctfltr_sub')) {
                            var subParent = $(this).next();
                        } else {
                            var subParent = $(this).closest('.prdctfltr_sub');
                        }

                        if (subParent.length == 0) {
                            if (mode === 'drill' || mode === 'drillback') {
                                checkCheckboxes.find('> .prdctfltr_sub').remove();
                            }
                        } else {

                            if (mode === 'drill' || mode === 'drillback') {
                                subParent.find('.prdctfltr_sub').remove();
                            }

                            var subParentCon = $('<div></div>').append(subParent.clone()).html();
                            if (mode.indexOf('back') !== -1 && subParent.prev().is('label')) {
                                subParentCon += $('<div></div>').append(subParent.prev().addClass('prdctfltr_hiddenparent').clone()).html();
                            }
                        }

                        if (typeof subParentCon != 'undefined') {
                            checkCheckboxes.empty();
                            checkCheckboxes.append(subParentCon);
                        }

                    });

                }

            });

        });

    }

    function get_category_mode(setView) {
        if (typeof setView === 'undefined') {
            prdctfltr_cats_mode_700();
        } else {
            prdctfltr_cats_mode_700(setView);
        }
    }
    get_category_mode();

    function prdctfltr_show_opened_cats(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.find('.prdctfltr_hierarchy label.prdctfltr_active').each(function() {
            if ($(this).next().is('.prdctfltr_sub')) {
                if (!$(this).hasClass('prdctfltr_show_subs')) {
                    $(this).addClass('prdctfltr_show_subs');
                }
            }

            $(this).parents('.prdctfltr_sub').each(function() {
                if (!$(this).prev().hasClass('prdctfltr_show_subs')) {
                    $(this).prev().addClass('prdctfltr_show_subs');
                }
            });

        });
    }

    function prdctfltr_all_cats(curr) {

        return false;

        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.find('.prdctfltr_expand_parents .prdctfltr_sub').each(function() {
            var curr = $(this);
            if (!curr.is(':visible')) {
                if (!curr.prev().hasClass('prdctfltr_show_subs')) {
                    curr.prev().addClass('prdctfltr_show_subs');
                }
            }
        });
    }

    function prdctfltr_make_clears(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        var clearActive = false;
        var currEls = curr.find('.prdctfltr_filter label.prdctfltr_active');
        var currElLength = currEls.length;

        if (curr.find('input[name^="mtar"]').filter(function() { return this.value !== ''; }).length > 0) {
            __get_clear_all_button_loop(curr);
        } else if (curr.find('input[name^="rng_m"]').filter(function() { return this.value !== ''; }).length > 0) {
            __get_clear_all_button_loop(curr);
        } else if (currElLength > 0) {
            currEls.each(function() {

                var currEl = $(this);
                var currElPrnt = currEl.closest('.prdctfltr_filter');
                var currElFilter = currElPrnt.attr('data-filter');

                if (prdctfltr.clearall[0] != null) {
                    if ($.inArray(currElFilter, prdctfltr.clearall) > -1) {

                    } else {
                        clearActive = true;
                    }
                } else {
                    clearActive = true;
                }

                if (!--currElLength) {
                    if (clearActive === true) {
                        __get_clear_all_button_loop(curr);
                    }
                }

            });
        } else if (curr.find('.prdctfltr_buttons label.prdctfltr_active').length > 0) {
            __get_clear_all_button_loop(curr);
        } else if (curr.find('.prdctfltr_add_inputs input.pf_added_orderby').length > 0) {
            __get_clear_all_button_loop(curr);
        }
    }

    function __get_clear_all_button_loop(e) {
        e.each(function() {
            if (!$(this).hasClass('pf_remove_clearall')) {
                __get_clear_all_button($(this));
            }
        });
    }

    function __get_clear_all_button(e) {
        e.find('.prdctfltr_buttons').append('<span class="prdctfltr_reset"><label><input name="reset_filter" type="checkbox" /><span>' + ( prdctfltr.js_filters[e.attr('data-id')]._tx_clearall === '' ? prdctfltr.localization.clearall : prdctfltr.js_filters[e.attr('data-id')]._tx_clearall )  + '</span></label></span>');
    }

    function prdctfltr_submit_form(curr_filter) {
        if (curr_filter.hasClass('prdctfltr_click_filter') || $('.prdctfltr_wc input[name="reset_filter"]:checked').length > 0) {
            prdctfltr_respond_550(curr_filter.find('form'));
        }
    }

    $('.prdctfltr_wc').each(function() {

        var curr = $(this);

        prdctfltr_filter_terms_init(curr);

        if (curr.find('.prdctfltr_expand_parents').length > 0) {
            prdctfltr_all_cats(curr);
        }
        prdctfltr_show_opened_cats(curr);

        if (curr.hasClass('prdctfltr_step_filter')) {
            var checkStep = curr.find('.prdctfltr_woocommerce_filter_submit');
            if (curr.find('.prdctfltr_woocommerce_filter_submit').length > 0) {
                curr.find('.prdctfltr_woocommerce_filter_submit').remove();
            }
            curr.find('.prdctfltr_buttons').prepend('<a class="button prdctfltr_woocommerce_filter_submit pf_stopajax" href="#">' + (prdctfltr.js_filters[curr.attr('data-id')].button_text === '' ? prdctfltr.localization.getproducts : prdctfltr.js_filters[curr.attr('data-id')].button_text) + '</a>');
            curr.closest('.prdctfltr_sc').addClass('prdctfltr_sc_step_filter');
        }

        if ($(this).attr('data-loader') !== 'none' && $(this).attr('data-loader').substring(0, 4) !== 'css-') {
            pf_preload_image(prdctfltr.url + 'lib/images/svg-loaders/' + $(this).attr('data-loader') + '.svg');
        }

        check_selection_boxes_wrapper(curr);
        prdctfltr_make_clears(curr);

    });

    function pf_preload_image(url) {
        var img = new Image();
        img.src = url;
    }

    $(document).on('change', '.prdctfltr_range input[name^="rng_"], .prdctfltr_meta_range input[name^="mtar"]', function() {
        if (ajaxActive === true) {
            return false;
        }

        var curr = $(this).closest('.prdctfltr_woocommerce');

        if (curr.hasClass('prdctfltr_click_filter')) {
            prdctfltr_respond_550(curr.find('.prdctfltr_woocommerce_ordering'));
        }
    });

    var stopAjax = false;
    $(document).on('click', '.prdctfltr_woocommerce_filter_submit', function() {
        if (ajaxActive === true) {
            return false;
        }

        if ($(this).hasClass('pf_stopajax')) {
            stopAjax = true;
        }

        var curr = $(this).closest('.prdctfltr_woocommerce_ordering');

        prdctfltr_respond_550(curr);

        return false;

    });

    $(document).on('click', '.prdctfltr_woocommerce_filter_title, .prdctfltr_showing', function() {
        $(this).parent().find('.prdctfltr_woocommerce_filter').trigger('click');
    });

    $(document).on('click', '.prdctfltr_woocommerce_filter', function(e) {
        if ( $('body').hasClass('wc-prdctfltr-active') ) {
            closeEverything();

            return false;
        }

        if (ajaxActive === true) {
            return false;
        }

        var f, form, btn;

        f = $(this).closest('.prdctfltr_wc');

        if (f.hasClass('prdctfltr_always_visible')) {
            return false;
        }

        form = f.find('.prdctfltr_woocommerce_ordering:first');
        btn = $(this);
        
        if (btn.hasClass('prdctfltr_active')) {
            btn.removeClass('prdctfltr_active');
            f.removeClass('xwc--pf-show-sidebar');

            if ( f.hasClass('pf_default') ) {
                btn.find('i').removeClass('prdctfltr-delete');
            }

            __deflate_body_class();

            hideOverlay();
        } else {
            btn.addClass('prdctfltr_active');
            f.addClass('xwc--pf-show-sidebar');

            $('body').addClass('wc-prdctfltr-active');

            if ( f.hasClass('pf_arrow') ) {
                var form_parent = form.parent();
                var form_parent_left = form_parent.offset().left;
                var screen_width = $(window).width();
    
                if((screen_width - form_parent_left)< form.outerWidth()){
                    form.addClass('xwc--pf-popup-right');
                }
            }

            if ( f.hasClass('pf_default') ) {
                btn.find('i').addClass('prdctfltr-delete');
            } else if ( form.find('.prdctfltr_close_sidebar').length==0 ) {
                form.prepend('<div class="prdctfltr_close_sidebar"><i class="prdctfltr-delete"></i> ' + (f.attr('class').indexOf(' pf_sidebar') > 0?"":prdctfltr.localization.close_filter )+ '</div>');
            }

            if (f.attr('class').indexOf(' pf_sidebar_css') > 0) {
                showOverlay();
            }
        }

        __check_masonry(f);

        return false;
    });

    function closeEverything() {
        __deflate_body_class();

        $('.prdctfltr_woocommerce_filter.prdctfltr_active').removeClass('prdctfltr_active').find('i').removeClass('prdctfltr-delete');
        $('.prdctfltr_wc.xwc--pf-show-sidebar').removeClass('xwc--pf-show-sidebar');
        $('.prdctfltr_close_sidebar').remove();

        hideOverlay();
    }
    function hideOverlay() {
        $('.prdctfltr_overlay.prdctfltr_active').removeClass('prdctfltr_active').addClass('prdctfltr_prepare');
        rClass('prdctfltr_prepare', $('.prdctfltr_overlay'));
    }

    function showOverlay() {
        $('.prdctfltr_overlay').addClass('prdctfltr_active');
    }

    function rClass( c, n ) {
        setTimeout( function(b) {
            b[1].removeClass(b[0]);
        }, 200, [c,n] );
    }

    $(document).on('click', '.prdctfltr_overlay, .prdctfltr_close_sidebar', function() {
        closeSidebars($(this));
    });

    function closeSidebars(e) {
        if (e.closest('.prdctfltr_wc').length > 0) {
            e.closest('.prdctfltr_wc').find('.prdctfltr_woocommerce_filter.prdctfltr_active').trigger('click');
        } else {
            $('.pf_sidebar_css .prdctfltr_woocommerce_filter.prdctfltr_active, .pf_sidebar_css_right .prdctfltr_woocommerce_filter.prdctfltr_active').trigger('click');
        }
    }

    $(document).on('click', '.pf_default_select .prdctfltr_widget_title, .prdctfltr_terms_customized_select .prdctfltr_widget_title', function() {

        var curr = $(this).closest('.prdctfltr_filter').find('.prdctfltr_add_scroll');

        if (!curr.hasClass('prdctfltr_down')) {
            $(this).find('.prdctfltr-down').attr('class', 'prdctfltr-up');
            curr.addClass('prdctfltr_down');
            curr.slideDown(100);
        } else {
            curr.slideUp(100);
            curr.removeClass('prdctfltr_down');
            $(this).find('.prdctfltr-up').attr('class', 'prdctfltr-down');
        }

    });

    var pf_select_opened = false;
    $(document).on('click', '.pf_select .prdctfltr_filter .prdctfltr_regular_title, .prdctfltr_terms_customized_select.prdctfltr_filter .prdctfltr_regular_title', function() {
        pf_select_opened = true;
        var curr = $(this).closest('.prdctfltr_filter').find('.prdctfltr_add_scroll');

        if (!curr.hasClass('prdctfltr_down')) {
            $(this).find('.prdctfltr-down').attr('class', 'prdctfltr-up');
            curr.addClass('prdctfltr_down');
            curr.slideDown(100, function() {
                pf_select_opened = false;
            });

            if (!$('body').hasClass('wc-prdctfltr-select')) {
                $('body').addClass('wc-prdctfltr-select');
            }
        } else {
            curr.slideUp(100, function() {
                pf_select_opened = false;

            });
            curr.removeClass('prdctfltr_down');
            $(this).find('.prdctfltr-up').attr('class', 'prdctfltr-down');
            if (curr.closest('.prdctfltr_woocommerce').find('.prdctfltr_down').length == 0) {
                $('body').removeClass('wc-prdctfltr-select');
            }
        }

    });
    /*var pf_select_opened = false;
    $(document).on('click', '.pf_select .prdctfltr_filter .prdctfltr_regular_title, .prdctfltr_terms_customized_select.prdctfltr_filter .prdctfltr_regular_title', function() {
        pf_select_opened = true;
        var curr = $(this).closest('.prdctfltr_filter').find('.prdctfltr_add_scroll');

        if (!curr.hasClass('prdctfltr_down')) {
            $(this).find('.prdctfltr-down').attr('class', 'prdctfltr-up');
            curr.addClass('prdctfltr_down');
            curr.slideDown(100, function() {
                pf_select_opened = false;
            });

            if (!$('body').hasClass('wc-prdctfltr-select')) {
                $('body').addClass('wc-prdctfltr-select');
            }
        } else {
            curr.slideUp(100, function() {
                pf_select_opened = false;

            });
            curr.removeClass('prdctfltr_down');
            $(this).find('.prdctfltr-up').attr('class', 'prdctfltr-down');
            if (curr.closest('.prdctfltr_woocommerce').find('.prdctfltr_down').length == 0) {
                $('body').removeClass('wc-prdctfltr-select');
            }
        }

    });*/

    $(document).on('click', 'body.wc-prdctfltr-select', function(e) {

        var curr_target = $(e.target);

        if ($('.prdctfltr_wc.pf_select .prdctfltr_down, .prdctfltr_terms_customized_select .prdctfltr_down').length > 0 && pf_select_opened === false && !curr_target.is('span, input, i')) {
            $('.prdctfltr_wc.pf_select .prdctfltr_down, .prdctfltr_wc:not(.prdctfltr_wc_widget.pf_default_select) .prdctfltr_terms_customized_select .prdctfltr_down').each(function() {
                var curr = $(this);
                if (curr.is(':visible')) {
                    curr.slideUp(100);
                    curr.removeClass('prdctfltr_down');
                    curr.closest('.prdctfltr_filter').find('span .prdctfltr-up').attr('class', 'prdctfltr-down');
                }
            });
            $('body').removeClass('wc-prdctfltr-select');
        }
    });

    $(document).on('click', 'span.prdctfltr_sale label, span.prdctfltr_instock label, span.prdctfltr_reset label', function() {

        if (ajaxActive === true) {
            return false;
        }

        var field = $(this).children('input:first');

        var curr_name = field.attr('name');
        var curr_filter = $(this).closest('.prdctfltr_wc');

        var ourObj = prdctfltr_get_obj_580(curr_filter);
        var pf_length = prdctfltr_count_obj_580(ourObj);

        if ($('body').hasClass('prdctfltr-ajax') && field.attr('name') === 'reset_filter') {
            $.each(ourObj, function(i, obj) {
                if (obj.find('.prdctfltr_buttons input[name="reset_filter"]').length == 0) {
                    obj.find('.prdctfltr_buttons').append('<input name="reset_filter" type="checkbox" checked />');
                }
            });
        }

        $.each(ourObj, function(i, obj) {

            obj = $(obj);

            var curr_obj = obj.find('.prdctfltr_buttons input[name="' + curr_name + '"]');
            if (curr_obj.length > 0) {
                curr_obj.each(function(i5, obj24) {
                    var obj25 = $(obj24);
                    if (!obj25.parent().hasClass('prdctfltr_active')) {
                        obj25.prop('checked', true).attr('checked', true).parent().addClass('prdctfltr_active');
                        de_check_buttons(obj25, 'notactive');
                    } else {
                        obj25.prop('checked', false).attr('checked', false).parent().removeClass('prdctfltr_active');
                        de_check_buttons(obj25, 'active');
                    }
                });
            }

            if (obj.find('.prdctfltr_filter.prdctfltr_instock').length > 0) {
                obj.find('.prdctfltr_filter.prdctfltr_instock input[name="instock_products"]').remove();
            }

            if (!--pf_length) {
                prdctfltr_submit_form(curr_filter);
            }

        });

    });

    $(document).on('click', '.prdctfltr_byprice label', function() {

        if (ajaxActive === true) {
            return false;
        }

        var curr_chckbx = $(this).find('input[type="checkbox"]');
        var curr = curr_chckbx.closest('.prdctfltr_filter');
        var curr_var = curr_chckbx.val().split('-');
        var curr_filter = curr_chckbx.closest('.prdctfltr_wc');

        if (curr_filter.hasClass('prdctfltr_tabbed_selection')) {
            var currVal = curr.find('input[name="min_price"]').val() + '-' + curr.find('input[name="max_price"]').val();
            if (currVal == curr_chckbx.val()) {
                return false;
            }
        }

        var ourObj = prdctfltr_get_obj_580(curr_filter);
        var pf_length = prdctfltr_count_obj_580(ourObj);

        if (curr_var[0] === '' && curr_var[1] === '' || curr_chckbx.closest('label').hasClass('prdctfltr_active')) {

            $.each(ourObj, function(i, obj) {
                var pfObj = $(obj).find('.prdctfltr_filter.prdctfltr_byprice');
                pfObj.find('.prdctfltr_active input[type="checkbox"]').prop('checked', false).attr('checked', false).closest('label').removeClass('prdctfltr_active');
                pfObj.find('input[name="min_price"]').val('');
                pfObj.find('input[name="max_price"]').val('');
                if (!--pf_length) {
                    prdctfltr_submit_form(curr_filter);
                }
            });

        } else {

            $.each(ourObj, function(i, obj) {
                var pfObj = $(obj).find('.prdctfltr_filter.prdctfltr_byprice');
                pfObj.find('.prdctfltr_active input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                pfObj.find('input[name="min_price"]').val(curr_var[0]);
                pfObj.find('input[name="max_price"]').val(curr_var[1]);
                pfObj.find('input[value="' + curr_var[0] + '-' + curr_var[1] + '"][type="checkbox"]').prop('checked', true).attr('checked', true).change().closest('label').addClass('prdctfltr_active');
                if (!--pf_length) {
                    prdctfltr_submit_form(curr_filter);
                }
            });

        }

        if (curr_filter.hasClass('prdctfltr_tabbed_selection') && curr_filter.hasClass('prdctfltr_click')) {
            curr_filter.find('.prdctfltr_filter').each(function() {
                if ($(this).find('input[type="hidden"]:first').length > 0 && $(this).find('input[type="hidden"]:first').val() !== '') {
                    if (!$(this).hasClass('prdctfltr_has_selection')) {
                        $(this).addClass('prdctfltr_has_selection');
                    }

                } else {
                    if ($(this).hasClass('prdctfltr_has_selection')) {
                        $(this).removeClass('prdctfltr_has_selection');
                    }
                }
            });
        }

        if (!curr_chckbx.closest('.prdctfltr_wc').hasClass('prdctfltr_wc_widget') && (curr_chckbx.closest('.prdctfltr_wc').hasClass('pf_select') || curr.hasClass('prdctfltr_terms_customized_select'))) {

            if (curr.hasClass('prdctfltr_terms_customized_select') && curr_chckbx.closest('.prdctfltr_wc').hasClass('prdctfltr_wc_widget') && curr_chckbx.closest('.prdctfltr_wc').hasClass('pf_default_select')) {
                return false;
            }
            curr_chckbx.closest('.prdctfltr_filter').find('.prdctfltr_add_scroll').slideUp(250).removeClass('prdctfltr_down');
            curr_chckbx.closest('.prdctfltr_filter').find('.prdctfltr_regular_title i.prdctfltr-up').removeClass('prdctfltr-up').addClass('prdctfltr-down');

        }


        $.each(ourObj, function(i, obj) {
            var pfObj = $(obj).find('.prdctfltr_filter[data-filter="price"]');
            pfObj.each(function() {
                check_selection_boxes($(this), 'look');
            });
        });


        return false;

    });

    $(document).on('click', '.prdctfltr_filter:not(.prdctfltr_byprice) label', function(event) {

        if ($(event.target).is('input')) {
            return false;
        }

        var curr_chckbx = $(this).find('input[type="checkbox"]');
        var curr = curr_chckbx.closest('.prdctfltr_filter');
        var curr_var = curr_chckbx.val();
        var curr_filter = curr.closest('.prdctfltr_wc');

        if (curr.hasClass('pf_adptv_unclick')) {
            if (curr_chckbx.parent().hasClass('pf_adoptive_hide')&&!curr_chckbx.parent().hasClass('prdctfltr_active')) {
                return false;
            }
        }

        prdctfltr_check_580(curr, curr_chckbx, curr_var, curr_filter);

        return false;

    });

    var shortcodeAjax = false;
    var prodcutsWrapper = false;
    var hasFilter = false;
    var hasProducts = false;
    var isAjax = false;
    var isStep = false;
    var hasWidget = false;

    function resetVars() {
        shortcodeAjax = false;
        prodcutsWrapper = false;
        hasFilter = false;
        hasProducts = false;
        isAjax = false;
        isStep = false;
        hasWidget = false;
    }

    function prdctfltr_get_obj_580(filter) {
        var ourObj = {};
        resetVars();

        if (filter.closest('.prdctfltr_sc').length > 0) {
            var scWrap = filter.closest('.prdctfltr_sc');
            var scMode = scWrap.is('.prdctfltr_sc_filter') ? 'sc_filter' : 'sc_shortcode';
            if (scWrap.find('.prdctfltr_wc').length > 0) {
                hasFilter = true;
            }
            if (scWrap.find(prdctfltr.ajax_class).length > 0) {
                hasProducts = true;
            }
            if (scWrap.hasClass('prdctfltr_ajax')) {
                isAjax = true;
                shortcodeAjax = true;
            }
            if (scWrap.find('.prdctfltr_wc').hasClass('prdctfltr_step_filter')) {
                isStep = true;
            }
            if ($('.prdctfltr_wc_widget').length > 0) {
                hasWidget = true;
            }
        } else if (filter.closest('.prdctfltr_wcsc').length > 0) {

        } else if (archiveAjax === true) {

        } else if (filter.closest('.prdctfltr_wc_widget').length > 0) {
            hasWidget = true;
            if ($('.prdctfltr_sc:not(.prdctfltr_sc_step_filter)').length > 0) {
                if ($('.prdctfltr_sc:not(.prdctfltr_sc_step_filter)').find(prdctfltr.ajax_class).length > 0) {
                    var scWrap = $('.prdctfltr_sc:not(.prdctfltr_sc_step_filter)');
                    var scMode = scWrap.is('.prdctfltr_sc_filter') ? 'sc_filter' : 'sc_shortcode';
                    hasFilter = true;
                    hasProducts = true;
                    prodcutsWrapper = scWrap;
                    shortcodeAjax = prodcutsWrapper.hasClass('prdctfltr_ajax');
                }
            }
        }

        if (isStep) {
            scWrap.find('.prdctfltr_wc').each(function() {
                ourObj[$(this).attr('data-id')] = $(this);
            });
        } else if (hasProducts && hasFilter) {
            prodcutsWrapper = scWrap;
            if (hasWidget) {
                scWrap.find('.prdctfltr_wc:not(.prdctfltr_step_filter)').each(function() {
                    ourObj[$(this).attr('data-id')] = $(this);
                });
                $('.prdctfltr_wc_widget:not(.prdctfltr_step_filter)').each(function() {
                    ourObj[$(this).attr('data-id')] = $(this);
                });
            } else {
                scWrap.find('.prdctfltr_wc:not(.prdctfltr_step_filter)').each(function() {
                    ourObj[$(this).attr('data-id')] = $(this);
                });
            }
        } else {
            $('.prdctfltr_wc:not([data-id="' + filter.attr('data-id') + '"]):not(.prdctfltr_step_filter)').each(function() {
                if ($(this).closest('.prdctfltr_sc_products').length == 0) {
                    ourObj[$(this).attr('data-id')] = $(this);
                }
            });
            ourObj[filter.attr('data-id')] = $('.prdctfltr_wc[data-id="' + filter.attr('data-id') + '"]');
        }

        return ourObj;

    }

    function prdctfltr_count_obj_580(ourObj) {
        var pf_length = 0;
        var i;
        for (i in ourObj) {
            if (ourObj.hasOwnProperty(i)) {
                pf_length++;
            }
        }
        return pf_length;
    }

    function prdctfltr_check_parent_helper_590(termParent, pfObj) {
        if (termParent) {
            var found = pfObj.find('input[value="' + termParent + '"]');
            if (found.length > 0) {
                pfObj.find('input[value="' + termParent + '"][type="checkbox"]').prop('checked', true).attr('checked', true).change().closest('label').addClass('prdctfltr_active');
            } else {
                pfObj.closest('.prdctfltr_wc').find('.prdctfltr_add_inputs').append('<input type="hidden" name="' + pfObj.attr('data-filter') + '" value="' + termParent + '" class="pf_added_input" />');

            }
        }
    }

    function prdctfltr_check_580(curr, curr_chckbx, curr_var, curr_filter) {

        if (ajaxActive === true) {
            return false;
        }

        var ourObj = prdctfltr_get_obj_580(curr_filter);
        var pf_length = prdctfltr_count_obj_580(ourObj);

        var field = curr.children('input[type="hidden"]:first');

        var curr_name = field.attr('name');
        var curr_val = field.val();

        if (curr_filter.hasClass('prdctfltr_tabbed_selection')) {
            if (curr_val == curr_chckbx.val()) {
                // return false;
            }
        }

        if ($('.pf_added_input[name="' + curr_name + '"]').length > 0) {
            $('.pf_added_input[name="' + curr_name + '"]').remove();
        }

        if (curr.hasClass('prdctfltr_selection')) {
            var checkLength = pf_length;
            $.each(ourObj, function(i, obj) {
                var pfObj1 = $(obj).find('.prdctfltr_filter:not(.prdctfltr_range):not([data-filter="' + curr_name + '"]) label.prdctfltr_active');
                if (pfObj1.length > 0) {
                    $.each(pfObj1, function(i3, ob5) {
                        $('.pf_added_input[name="' + $(ob5).closest('.prdctfltr_filter').attr('data-filter') + '"]').remove();
                        $(ob5).removeClass('prdctfltr_active').find('input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('.prdctfltr_filter').find('input[type="hidden"]').val('');
                    });
                }
                var pfObj = $(obj).find('.prdctfltr_filter.prdctfltr_range input[type="hidden"][val!=""]');
                if (pfObj.length > 0) {
                    $.each(pfObj, function(i2, obj4) {
                        $('.pf_added_input[name="' + $(obj4).attr('name') + '"]').remove();
                        $(obj4).closest('.prdctfltr_filter').find('input[type="hidden"]').val('');
                    });
                }

                if (!--checkLength) {
                    $.each(ourObj, function(i4, obj47) {

                        $(obj47).find('.prdctfltr_buttons input[name="sale_products"], .prdctfltr_buttons input[name="instock_products"]').each(function() {
                            $(this).prop('checked', false).attr('checked', false).closest('label').removeClass('prdctfltr_active');
                            de_check_buttons($(this), 'active');
                        });

                        $(obj47).find('input.pf_search').val('');

                        $(obj47).find('input[id^="prdctfltr_rng_"]').each(function() {
                            var setRng = $(this).data('ionRangeSlider');
                            ranges[$(this).attr('id')].update({
                                from: setRng.options.min,
                                to: setRng.options.max
                            });
                        });

                        $(obj47).find('.prdctfltr_filter').each(function() {
                            check_selection_boxes($(this), 'init');
                        });

                    });
                }

            });
        }

        if (!curr.hasClass('prdctfltr_multi')) {

            if (curr_var === '' || curr_chckbx.closest('label').hasClass('prdctfltr_active')) {

                var termParent = curr_chckbx.attr('data-parent');

                $.each(ourObj, function(i, obj) {
                    var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');
                    pfObj.find('.prdctfltr_active input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');

                    if (termParent) {
                        prdctfltr_check_parent_helper_590(termParent, pfObj);
                        pfObj.find('input[name="' + curr_name + '"]').val(termParent);
                    } else {
                        pfObj.find('input[name="' + curr_name + '"]').val('');
                    }

                    if (!--pf_length) {
                        prdctfltr_submit_form(curr_filter);
                    }
                });

            } else {

                $.each(ourObj, function(i, obj) {
                    var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');
                    pfObj.find('.prdctfltr_active input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                    pfObj.find('input[name="' + curr_name + '"]').val(curr_var);
                    pfObj.find('input[value="' + curr_var + '"][type="checkbox"]').prop('checked', true).attr('checked', true).change().closest('label').addClass('prdctfltr_active');
                    if (!--pf_length) {
                        prdctfltr_submit_form(curr_filter);
                    }
                });

            }

            if (curr_chckbx.closest('.prdctfltr_wc').hasClass('pf_select') || curr.hasClass('prdctfltr_terms_customized_select')) {
                if (curr.hasClass('prdctfltr_terms_customized_select') && curr_chckbx.closest('.prdctfltr_wc').hasClass('prdctfltr_wc_widget') && curr_chckbx.closest('.prdctfltr_wc').hasClass('pf_default_select')) {
                    return false;
                }
                curr_chckbx.closest('.prdctfltr_filter').find('.prdctfltr_add_scroll').slideUp(250).removeClass('prdctfltr_down');
                curr_chckbx.closest('.prdctfltr_filter').find('.prdctfltr_regular_title i.prdctfltr-up').removeClass('prdctfltr-up').addClass('prdctfltr-down');
            }

        } else {

            if (curr_chckbx.val() !== '') {

                if (curr_chckbx.closest('label').hasClass('prdctfltr_active')) {

                    if (curr.hasClass('prdctfltr_merge_terms')) {
                        var curr_settings = (curr_val.indexOf('+') > 0 ? curr_val.replace('+' + curr_var, '').replace(curr_var + '+', '') : '');

                        $.each(prdctfltr.js_filters, function(n18, obj43) {
                            if (typeof obj43.adds !== 'undefined' && obj43.adds[curr_name] !== null) {
                                var check = prdctfltr.js_filters[n18].adds[curr_name];
                                prdctfltr.js_filters[n18].adds[curr_name] = (typeof check !== 'undefined' && check.indexOf('+') > 0 ? check.replace('+' + curr_var, '').replace(curr_var + '+', '') : '');
                            }
                        });
                    } else {
                        var curr_settings = (curr_val.indexOf(',') > 0 ? curr_val.replace(',' + curr_var, '').replace(curr_var + ',', '') : '');

                        $.each(prdctfltr.js_filters, function(n18, obj43) {
                            if (typeof obj43.adds !== 'undefined' && obj43.adds[curr_name] !== null) {
                                var check = prdctfltr.js_filters[n18].adds[curr_name];
                                prdctfltr.js_filters[n18].adds[curr_name] = (typeof check !== 'undefined' && check.indexOf(',') > 0 ? check.replace(',' + curr_var, '').replace(curr_var + ',', '') : '');
                            }
                        });
                    }

                    var termParent = curr_chckbx.attr('data-parent');

                    $.each(ourObj, function(i, obj) {
                        var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');
                        pfObj.find('input[name="' + curr_name + '"]').val(curr_settings);
                        pfObj.find('input[value="' + curr_var + '"][type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');

                        if (termParent) {
                            if (curr_settings === '') {
                                prdctfltr_check_parent_helper_590(termParent, pfObj);
                                pfObj.find('input[name="' + curr_name + '"]').val(termParent);
                            }
                        }

                        if (!--pf_length) {
                            prdctfltr_submit_form(curr_filter);
                        }

                    });

                } else {

                    $('.prdctfltr_filter[data-filter="' + curr_name + '"] .prdctfltr_sub[data-sub="' + curr_var + '"]').find('.prdctfltr_active input[type="checkbox"]').each(function() {

                        var checkVal = $(this).val();
                        if (curr.hasClass('prdctfltr_merge_terms')) {
                            if (curr_val.indexOf('+') > 0) {
                                curr_val = curr_val.replace('+' + checkVal, '').replace(checkVal + '+', '');
                            } else {
                                curr_val = curr_val.replace(checkVal, '');
                            }
                        } else {
                            if (curr_val.indexOf(',') > 0) {
                                curr_val = curr_val.replace(',' + checkVal, '').replace(checkVal + ',', '');
                            } else {
                                curr_val = curr_val.replace(checkVal, '');
                            }
                        }
                        $(this).prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                    });

                    if (curr.hasClass('prdctfltr_merge_terms')) {

                        if (curr.closest('.prdctfltr_wc').find('.prdctfltr_filter[data-filter="' + curr_name + '"]').length > 1) {
                            curr.find('.prdctfltr_active').each(function() {
                                var val12 = $(this).find('input[type="checkbox"]').val();
                                if (curr_val.indexOf('+') > 0) {
                                    curr_val = curr_val.replace('+' + val12, '').replace(val12 + '+', '');
                                } else {
                                    curr_val = curr_val.replace(val12, '');
                                }
                                $(this).find('input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                            });
                        }

                        var curr_settings = (curr_val === '' ? curr_var : curr_val + '+' + curr_var);
                    } else {
                        var curr_settings = (curr_val === '' ? curr_var : curr_val + ',' + curr_var);
                    }

                    var termParent = curr_chckbx.attr('data-parent');

                    $.each(ourObj, function(i, obj) {
                        var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');
                        pfObj.find('input[name="' + curr_name + '"]').val(curr_settings);
                        pfObj.find('input[value="' + curr_var + '"][type="checkbox"]').prop('checked', true).attr('checked', true).change().closest('label').addClass('prdctfltr_active');

                        if (termParent) {
                            if (pfObj.find('input[value="' + termParent + '"][type="checkbox"]:checked').length > 0) {
                                pfObj.find('input[value="' + termParent + '"][type="checkbox"]:checked').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                                if (curr_settings.indexOf(termParent) > -1) {
                                    if (curr.hasClass('prdctfltr_merge_terms')) {
                                        var makeNew = (curr_settings.indexOf('+') > 0 ? curr_settings.replace('+' + termParent, '').replace(termParent + '+', '') : '');
                                    } else {
                                        var makeNew = (curr_settings.indexOf(',') > 0 ? curr_settings.replace(',' + termParent, '').replace(termParent + ',', '') : '');
                                    }
                                    pfObj.find('input[name="' + curr_name + '"]').val(makeNew);
                                }
                            } else {
                                var remTermParent = pfObj.find('input[value="' + termParent + '"][type="checkbox"]').attr('data-parent');
                                if (remTermParent) {
                                    while (remTermParent !== false) {
                                        pfObj.find('input[value="' + remTermParent + '"][type="checkbox"]:checked').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                                        if (curr_settings.indexOf(remTermParent) > -1) {
                                            if (curr.hasClass('prdctfltr_merge_terms')) {
                                                var makeNew = (curr_settings.indexOf('+') > 0 ? curr_settings.replace('+' + remTermParent, '').replace(remTermParent + '+', '') : '');
                                            } else {
                                                var makeNew = (curr_settings.indexOf(',') > 0 ? curr_settings.replace(',' + remTermParent, '').replace(remTermParent + ',', '') : '');
                                            }
                                            pfObj.find('input[name="' + curr_name + '"]').val(makeNew);
                                        }
                                        remTermParent = (pfObj.find('input[value="' + remTermParent + '"][type="checkbox"]').attr('data-parent') ? pfObj.find('input[value="' + remTermParent + '"][type="checkbox"]').attr('data-parent') : false);
                                    }
                                }
                            }
                        }

                        if (!--pf_length) {
                            prdctfltr_submit_form(curr_filter);
                        }
                    });

                }
            } else {

                $.each(ourObj, function(i, obj) {
                    var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');

                    if (pfObj.find('label.prdctfltr_active input[data-parent]').length > 0) {
                        if (pfObj.find('label.prdctfltr_active input[data-parent]').length == pfObj.find('label.prdctfltr_active input[data-parent="' + pfObj.find('label.prdctfltr_active input[data-parent]:first').attr('data-parent') + '"]').length) {
                            pfObj.find('input[name="' + curr_name + '"]').val(pfObj.find('label.prdctfltr_active input[data-parent]:first').attr('data-parent'));
                            pfObj.find('input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                        }
                    } else {
                        pfObj.find('input[name="' + curr_name + '"]').val('');
                        pfObj.find('input[type="checkbox"]').prop('checked', false).attr('checked', false).change().closest('label').removeClass('prdctfltr_active');
                    }

                    if (!--pf_length) {
                        prdctfltr_submit_form(curr_filter);
                    }
                });

            }

        }

        if (curr_filter.hasClass('prdctfltr_tabbed_selection') && curr_filter.hasClass('prdctfltr_click')) {
            curr_filter.find('.prdctfltr_filter').each(function() {
                if ($(this).find('input[type="hidden"]:first').length > 0 && $(this).find('input[type="hidden"]:first').val() !== '') {
                    if (!$(this).hasClass('prdctfltr_has_selection')) {
                        $(this).addClass('prdctfltr_has_selection');
                    }
                } else {
                    if ($(this).hasClass('prdctfltr_has_selection')) {
                        $(this).removeClass('prdctfltr_has_selection');
                    }
                }
            });
        }


        $.each(ourObj, function(i, obj) {
            var pfObj = $(obj).find('.prdctfltr_filter[data-filter="' + curr_name + '"]');
            pfObj.each(function() {
                check_selection_boxes($(this), 'look');
            });
        });

    }

    function check_selection_boxes_wrapper(curr) {

        curr.find('.prdctfltr_filter').each(function() {
            check_selection_boxes($(this), 'init');
        });

        curr.find('.prdctfltr_buttons:first label.prdctfltr_active').each(function() {
            check_buttons($(this), 'init');
        });

    }

    function de_check_buttons(curr, mode) {

        var collectors = prdctfltr.js_filters[curr.closest('.prdctfltr_wc').attr('data-id')].collectors;
        var collectorStyle = prdctfltr.js_filters[curr.closest('.prdctfltr_wc').attr('data-id')].collector_style;

        if (mode === 'active') {

            $.each(collectors, function(i, e) {
                switch (e) {

                    case 'collector':
                        var wrap = curr.closest('.prdctfltr_woocommerce_ordering');

                        var collector = wrap.find('.prdctfltr_collector');
                        if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').length > 0) {
                            collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                        }

                        break;

                    case 'topbar':
                        var wrap = curr.closest('.prdctfltr_wc');

                        var collector = wrap.find('.prdctfltr_topbar');
                        if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').length > 0) {
                            collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                        }

                        break;

                    default:

                        break;
                }

            });
        } else {

            var input = '<span class="prdctfltr_title_selected"><span class="prdctfltr_title_added prdctfltr_title_remove" data-key="' + curr.attr('name') + '"><i class="prdctfltr-check"></i></span> <span class="prdctfltr_selected_title">' + curr.parent().text() + '</span><span class="prdctfltr_title_selected_separator"></span></span>';

            $.each(collectors, function(i, e) {
                switch (e) {

                    case 'collector':
                        var wrap = curr.closest('.prdctfltr_woocommerce_ordering');

                        if (wrap.find('.prdctfltr_collector').length == 0) {
                            if (wrap.find('.prdctfltr_close_sidebar:first').length>0) {
                                wrap.find('.prdctfltr_close_sidebar:first').after('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                            } else {
                                wrap.prepend('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                            }
                        } else {
                            var collector = wrap.find('.prdctfltr_collector');
                            if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').length > 0) {
                                collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                            }
                            wrap.find('.prdctfltr_collector').append(input);
                        }
                        break;

                    case 'topbar':

                        var wrap = curr.closest('.prdctfltr_wc');

                        if (wrap.find('.prdctfltr_topbar').length == 0) {
                            wrap.find('.prdctfltr_woocommerce_filter_title').after('<div class="prdctfltr_topbar"></div>');
                            wrap.find('.prdctfltr_topbar').html(input);
                        } else {
                            var collector = wrap.find('.prdctfltr_topbar');
                            if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').length > 0) {
                                collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                            }
                            wrap.find('.prdctfltr_topbar').append(input);
                        }

                        break;

                    default:

                        break;
                }

            });

        }

        __check_masonry(curr.closest('.prdctfltr_wc'));
    }

    function check_buttons(curr, mode) {

        var collectors = prdctfltr.js_filters[curr.closest('.prdctfltr_wc').attr('data-id')].collectors;
        var collectorStyle = prdctfltr.js_filters[curr.closest('.prdctfltr_wc').attr('data-id')].collector_style;

        var input = '<span class="prdctfltr_title_selected">' + (mode === 'init' ? '<a href="#" class="prdctfltr_title_remove" data-key="' + curr.find('input:first').attr('name') + '"><i class="prdctfltr-delete"></i></a>' : '<span class="prdctfltr_title_added prdctfltr_title_remove" data-key="' + curr.find('input:first').attr('name') + '"><i class="prdctfltr-check"></i></span>') + ' <span class="prdctfltr_selected_title">' + curr.text() + '</span><span class="prdctfltr_title_selected_separator"></span></span>';

        $.each(collectors, function(i, e) {
            switch (e) {

                case 'collector':
                    var wrap = curr.closest('.prdctfltr_woocommerce_ordering');

                    if (wrap.find('.prdctfltr_collector').length == 0) {
                        if (wrap.find('.prdctfltr_close_sidebar:first').length>0) {
                            wrap.find('.prdctfltr_close_sidebar:first').after('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                        } else {
                            wrap.prepend('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                        }
                    } else {
                        var collector = wrap.find('.prdctfltr_collector');
                        if (collector.find('.prdctfltr_title_remove[data-key="' + curr.find('input:first').attr('name') + '"]').length > 0) {
                            collector.find('.prdctfltr_title_remove[data-key="' + curr.find('input:first').attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                        }
                        wrap.find('.prdctfltr_collector').append(input);
                    }
                    break;

                case 'topbar':

                    var wrap = curr.closest('.prdctfltr_wc');

                    if (wrap.find('.prdctfltr_topbar').length == 0) {
                        wrap.find('.prdctfltr_woocommerce_filter_title').after('<div class="prdctfltr_topbar"></div>');
                        wrap.find('.prdctfltr_topbar').html(input);
                    } else {
                        var collector = wrap.find('.prdctfltr_topbar');
                        if (collector.find('.prdctfltr_title_remove[data-key="' + curr.find('input:first').attr('name') + '"]').length > 0) {
                            collector.find('.prdctfltr_title_remove[data-key="' + curr.find('input:first').attr('name') + '"]').closest('.prdctfltr_title_selected').remove();
                        }
                        wrap.find('.prdctfltr_topbar').append(input);
                    }

                    break;

                default:

                    break;
            }

        });

        __check_masonry(curr.closest('.prdctfltr_wc'));
    }

    function get_input_delete(selectedTerms, mode, curr, slug) {
        return '<span class="prdctfltr_title_selected">' + (mode === 'init' ? '<a href="#" class="prdctfltr_title_remove" data-key="' + curr.attr('data-filter') + '"' + slug + '><i class="prdctfltr-delete"></i></a>' : '<span class="prdctfltr_title_added prdctfltr_title_remove" data-key="' + curr.attr('data-filter') + '"' + slug + '><i class="prdctfltr-check"></i></span>') + ' <span class="prdctfltr_selected_title">' + selectedTerms + '</span><span class="prdctfltr_title_selected_separator"></span></span>';
    }

    function check_selection_boxes(curr, mode) {

        var selectedTerms = [];
        var selectedItms = [];
        curr.find('label.prdctfltr_active').each(function() {
            if ($(this).find('.prdctfltr_customization_search').length > 0) {
                selectedTerms.push($(this).find('.prdctfltr_customization_search').text());
            } else if ($(this).find('.prdctfltr_customize_name').length > 0) {
                selectedTerms.push($(this).find('.prdctfltr_customize_name').text());
            } else {
                selectedTerms.push($(this).find('span:first').contents().filter(function() { return 3 == this.nodeType; }).text());
            }
            if ($(this).closest('.prdctfltr_filter').hasClass('prdctfltr_attributes') || $(this).closest('.prdctfltr_filter').hasClass('prdctfltr_meta')) {
                selectedItms.push($(this).find('input[type="checkbox"]:first').val());
            }
        });

        if (typeof selectedTerms[0] === 'undefined' && curr.hasClass('prdctfltr_range')) {
            var rngData = curr.find('[id^="prdctfltr_rng_"]:first').data('ionRangeSlider');

            if (typeof rngData !== 'undefined') {
                if ((rngData.result.from == rngData.options.min && rngData.result.to == rngData.options.max) === false) {
                    if (curr.attr('data-filter') === 'rng_price') {
                        selectedTerms.push(rngData.options.prefix + rngData.result.from + rngData.options.postfix + ' &longleftrightarrow; ' + rngData.options.prefix + rngData.result.to + rngData.options.postfix);
                    } else {
                        selectedTerms.push(rngData.options.prefix + rngData.options.prettyValues[rngData.result.from] + rngData.options.postfix + ' &longleftrightarrow; ' + rngData.options.prefix + rngData.options.prettyValues[rngData.result.to] + rngData.options.postfix);
                    }

                }
            }
        }

        if (typeof selectedTerms[0] === 'undefined' && curr.hasClass('prdctfltr_meta_range')) {
            var rngData = curr.find('[id^="prdctfltr_rng_"]:first').data('ionRangeSlider');

            if (typeof rngData !== 'undefined') {
                if ((rngData.result.from == rngData.options.min && rngData.result.to == rngData.options.max) === false) {

                    if (u(rngData.options.prettify_enabled) === true) {
                        selectedTerms.push(rngData.options.prefix + rngData.options.prettyValues[rngData.result.from] + rngData.options.postfix + ' &longleftrightarrow; ' + rngData.options.prefix + rngData.options.prettyValues[rngData.result.to] + rngData.options.postfix);
                    } else {
                        selectedTerms.push(rngData.options.prefix + rngData.result.from + rngData.options.postfix + ' &longleftrightarrow; ' + rngData.options.prefix + rngData.result.to + rngData.options.postfix);
                    }

                }
            }
        }

        if (typeof selectedTerms[0] !== 'undefined') {

            var col = prdctfltr.js_filters[curr.closest('.prdctfltr_wc').attr('data-id')];

            var collectors = typeof col !== 'undefined' ? col.collectors : [];
            var collectorStyle = typeof col !== 'undefined' ? col.collector_style : [];

            var slug = '';
            if (curr.hasClass('prdctfltr_attributes') || curr.hasClass('prdctfltr_meta')) {
                if (1 == 1 && typeof selectedTerms[1] !== 'undefined') {
                    var input = '';
                    $.each(selectedItms, function(o23, k23) {
                        slug = ' data-slug="' + selectedItms[o23] + '"';
                        input += get_input_delete(selectedTerms[o23], mode, curr, slug);
                    });
                } else {
                    var value = curr.find('input[type="hidden"]:first').val();
                    var parent = curr.find('input[type="hidden"]:first').attr('data-parent');
                    slug = ' data-slug="' + (typeof parent !== 'undefined' ? parent + '>' : '') + value + '"';
                    var input = get_input_delete(selectedTerms.join(', '), mode, curr, slug);
                }
            } else {
                var input = '<span class="prdctfltr_title_selected">' + (mode === 'init' ? '<a href="#" class="prdctfltr_title_remove" data-key="' + curr.attr('data-filter') + '"' + slug + '><i class="prdctfltr-delete"></i></a>' : '<span class="prdctfltr_title_added prdctfltr_title_remove" data-key="' + curr.attr('data-filter') + '"' + slug + '><i class="prdctfltr-check"></i></span>') + ' <span class="prdctfltr_selected_title">' + selectedTerms.join(', ') + '</span><span class="prdctfltr_title_selected_separator"></span></span>';
            }

            $.each(collectors, function(i, e) {
                switch (e) {
                    case 'intitle':
                        curr.find('.prdctfltr_regular_title .prdctfltr_title_selected, .prdctfltr_widget_title  .prdctfltr_title_selected').remove();
                        curr.find('.prdctfltr_regular_title, .prdctfltr_widget_title').prepend(input);
                        break;

                    case 'aftertitle':
                        curr.find('.prdctfltr_aftertitle').remove();
                        curr.find('.prdctfltr_add_scroll').before('<div class="prdctfltr_aftertitle prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                        break;

                    case 'collector':
                        var wrap = curr.closest('.prdctfltr_woocommerce_ordering');

                        if (wrap.find('.prdctfltr_collector').length == 0) {
                            if (wrap.find('.prdctfltr_close_sidebar:first').length>0) {
                                wrap.find('.prdctfltr_close_sidebar:first').after('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                            } else {
                                wrap.prepend('<div class="prdctfltr_collector prdctfltr_collector_' + collectorStyle + '">' + input + '</div>');
                            }
                        } else {
                            var collector = wrap.find('.prdctfltr_collector');
                            if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').length > 0) {
                                collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').closest('.prdctfltr_title_selected').remove();
                            }
                            wrap.find('.prdctfltr_collector').append(input);
                        }
                        break;

                    case 'topbar':

                        var wrap = curr.closest('.prdctfltr_wc');

                        if (wrap.find('.prdctfltr_topbar').length == 0) {
                            wrap.find('.prdctfltr_woocommerce_filter_title').after('<div class="prdctfltr_topbar"></div>');
                            wrap.find('.prdctfltr_topbar').html(input);
                        } else {
                            var collector = wrap.find('.prdctfltr_topbar');
                            if (collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').length > 0) {
                                collector.find('.prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').closest('.prdctfltr_title_selected').remove();
                            }
                            wrap.find('.prdctfltr_topbar').append(input);
                        }

                        break;

                    default:

                        break;
                }

            });

        } else if (typeof selectedTerms[0] === 'undefined') {
            if (curr.closest('.prdctfltr_wc').find('.prdctfltr_attributes[data-filter="' + curr.attr('data-filter') + '"] label.prdctfltr_active').length == 0) {
                curr.find('.prdctfltr_title_selected').remove();
                curr.closest('.prdctfltr_wc').find('.prdctfltr_collector .prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').closest('.prdctfltr_title_selected').remove();
                curr.closest('.prdctfltr_wc').find('.prdctfltr_topbar .prdctfltr_title_remove[data-key="' + curr.attr('data-filter') + '"]').closest('.prdctfltr_title_selected').remove();
            }
        }

        __check_masonry(curr.closest('.prdctfltr_wc'));
    }

    function clear_filters_after(filter) {
        filter.nextAll('.prdctfltr_filter').each(function() {
            $(this).find('input[type="hidden"]').val('');
        });
    }

    function clicked_remove(obj, mode, term) {

        switch (term) {
            case 's':
            case 'search':
            case 'search_products':
                var srchStr = 'input[name="s"],input[name="search_products"]';
                break;

            case 'price':
                var srchStr = 'input[name="min_price"],input[name="max_price"]';
                break;

            default:
                var srchStr = 'input[name="' + term + '"]';
                break;
        }

        if (srchStr === 'input[name="s"],input[name="search_products"]') {
            if (mode === true) {
                obj.closest('.prdctfltr_sc_products').find('.prdctfltr_filter, .prdctfltr_buttons').find(srchStr).val('');

                if ($('.prdctfltr_wc_widget').length > 0) {
                    $('.prdctfltr_wc_widget').find('.prdctfltr_filter, .prdctfltr_buttons').find(srchStr).val('');
                }
                $('.prdctfltr_add_inputs').find(srchStr).val('');
            } else {
                $('.prdctfltr_filter, .prdctfltr_add_inputs, .prdctfltr_buttons').find(srchStr).val('');
            }
        } else {
            if (mode === true) {
                obj.closest('.prdctfltr_sc_products').find('.prdctfltr_filter, .prdctfltr_buttons').find(srchStr).remove();

                if ($('.prdctfltr_wc_widget').length > 0) {
                    $('.prdctfltr_wc_widget').find('.prdctfltr_filter, .prdctfltr_buttons').find(srchStr).remove();
                }
                $('.prdctfltr_add_inputs').find(srchStr).remove();
            } else {
                $('.prdctfltr_filter, .prdctfltr_add_inputs, .prdctfltr_buttons').find(srchStr).remove();
            }
        }


    }

    $(document).on('click', 'a.prdctfltr_title_remove', function() {

        if (ajaxActive === true) {
            return false;
        }

        var filter = $(this).attr('data-key');

        if (filter.substring(0, 4) !== 'rng_') {
            var selectedRemove = $(this).attr('data-slug');
            if (typeof selectedRemove !== 'undefined' && selectedRemove.indexOf('>') > 0) {
                selectedRemove = selectedRemove.substring(selectedRemove.indexOf('>') + 1);
            }

            var checkRemove = $(this).closest('.prdctfltr_wc').find('.prdctfltr_filter[data-filter="' + filter + '"] input[value="' + selectedRemove + '"]');

            if (checkRemove.length > 0) {
                checkRemove.closest('label').trigger('click');
                var checkSubmit = checkRemove.closest('.prdctfltr_wc').find('.prdctfltr_woocommerce_filter_submit');
                if (checkSubmit.length > 0) {
                    checkSubmit.trigger('click');
                }

                return false;
            }
        }

        if ($(this).closest('.prdctfltr_filter').hasClass('prdctfltr_has_selection')) {
            clear_filters_after($(this).closest('.prdctfltr_filter'));
        }

        var mode = $(this).closest('.prdctfltr_sc_products').length > 0;

        if (filter === 's' || filter === 'search_products' || filter === 'search') {
            clicked_remove($(this), mode, filter);
        } else if (filter === 'price') {
            clicked_remove($(this), mode, filter);
        } else if (filter === 'orderby' || filter === 'sale_products' || filter === 'instock_products') {
            clicked_remove($(this), mode, filter);
        } else if (filter === 'vendor' || filter === 'instock' || filter === 'products_per_page' || filter === 'rating_filter') {
            clicked_remove($(this), mode, filter);
        } else if (filter.substring(0, 4) === 'mtar') {
            clicked_remove($(this), mode, filter);
        } else if (filter.substring(0, 4) !== 'rng_') {

            if ($(this).closest('.prdctfltr_sc_products').length > 0) {
                var curr_els = $(this).closest('.prdctfltr_sc_products').find('input[name="' + filter + '"]');
                if ($('.prdctfltr_wc_widget').length > 0) {
                    curr_els.push($('.prdctfltr_wc_widget').find('input[name="' + filter + '"]'));
                }
            } else {
                var curr_els = $('.prdctfltr_filter, .prdctfltr_add_inputs').find('input[name="' + filter + '"]');
            }

            var selectedString = $(this).attr('data-slug');
            if (selectedString.indexOf('>') > 0) {
                var termParent = selectedString.substring(0, selectedString.indexOf('>'));
                selectedString = selectedString.substring(selectedString.indexOf('>') + 1);
            }

            var cur_vals = [];
            if (selectedString.indexOf(',') > 0) {
                cur_vals = selectedString.split(',');
            } else if (selectedString.indexOf('+') > 0) {
                cur_vals = selectedString.split('+');
            } else {
                cur_vals[0] = selectedString;
            }

            var cv_lenght = cur_vals.length;

            $.each(cur_vals, function(i, val23) {

                var curr_value = val23;

                curr_els.each(function() {

                    var curr_chckd = $(this);
                    var curr_chckdval = $(this).val();

                    if (curr_chckdval.indexOf(',') > 0) {
                        curr_chckd.val(curr_chckdval.replace(',' + curr_value, '').replace(curr_value + ',', ''));
                    } else if (curr_chckdval.indexOf('+') > 0) {
                        curr_chckd.val(curr_chckdval.replace('+' + curr_value, '').replace(curr_value + '+', ''));
                    } else {
                        curr_chckd.val(curr_chckdval.replace(curr_value, '').replace(curr_value, ''));
                    }

                });

                if (!--cv_lenght) {
                    curr_els.each(function() {
                        var curr_chckd = $(this);

                        if (termParent) {
                            curr_chckd.val(termParent);
                            if (curr_chckd.val() === '') {
                                curr_chckd.val(termParent);
                            }

                        }

                    });
                }
            });

        } else {
            if ($(this).closest('.prdctfltr_sc_products').length > 0) {
                if (filter === 'rng_price') {
                    $(this).closest('.prdctfltr_sc_products').find('.prdctfltr_range.prdctfltr_rng_price input[type="hidden"]').each(function() {
                        $(this).remove();
                    });
                    $('.prdctfltr_wc_widget').find('.prdctfltr_range.prdctfltr_rng_price input[type="hidden"]').remove()
                } else {
                    $(this).closest('.prdctfltr_sc_products').find('.prdctfltr_range input[type="hidden"][name$="' + filter.substring(4, filter.length) + '"]').each(function() {
                        $(this).remove();
                    });
                    $('.prdctfltr_wc_widget').find('.prdctfltr_range input[type="hidden"][name$="' + filter.substring(4, filter.length) + '"]').remove();
                }

            } else {
                if (filter === 'rng_price') {
                    $('.prdctfltr_wc').find('.prdctfltr_range.prdctfltr_rng_price input[type="hidden"]').each(function() {
                        $(this).remove();
                    });
                } else {
                    $('.prdctfltr_wc').find('.prdctfltr_range input[type="hidden"][name$="' + filter.substring(4, filter.length) + '"]').each(function() {
                        $(this).remove();
                    });
                }
            }
        }

        prdctfltr_respond_550($(this).closest('.prdctfltr_wc').find('form.prdctfltr_woocommerce_ordering'));

        return false;

    });

    $(document).on('click', 'i.prdctfltr-plus', function() {
        $(this).closest('label').toggleClass('prdctfltr_show_subs');
        __check_masonry($(this).closest('.prdctfltr_wc'));

        return false;
    });

    function loaderPlayAnimation(f) {
        $('body').append('<div class="xwc--pf-loader-overlay"></div>');
    }

    function loaderStopAnimation(f) {
        $('.xwc--pf-loader-overlay').remove();
    }

    function loaderPlayTitleAnimation(f) {
        f.addClass('xwc--pf-loading');
    }

    function prdctfltr_get_loader(curr) {
        var f = curr.closest('.prdctfltr_wc');

        if (u(f.attr('data-loader'))===false) {
            return false;
        }

        if (f.attr('data-loader') === 'none') {
            return false;
        }

        if (f.attr('data-loader').substring(0,16) === 'css-spinner-full') {
            loaderPlayAnimation(f);
        } else {
            loaderPlayTitleAnimation(f);
        }

        return false;
    }

    function prdctfltr_reset_filters_550(obj) {

        checkAddInputs(obj);

        obj.find('.prdctfltr_filter input[type="hidden"]').each(function() {
            if (typeof prdctfltr.clearall[0] != "undefined") {
                if ($.inArray(this.name, prdctfltr.clearall) > -1) {
                    if (!$(this).val()) {
                        if ($(this).attr('data-parent')) {
                            $(this).val($(this).attr('data-parent'));
                        } else {
                            $(this).remove();
                        }
                    }
                } else {
                    if ($(this).attr('data-parent')) {
                        $(this).val($(this).attr('data-parent'));
                    } else {
                        $(this).remove();
                    }
                }
            } else {
                if ($(this).attr('data-parent')) {
                    $(this).val($(this).attr('data-parent'));
                } else {
                    $(this).remove();
                }
            }
        });

        obj.find('.prdctfltr_filter input.pf_search').val('').prop('disabled', true).attr('disabled', 'true');

        if (obj.find('input[name="s"]').length > 0) {
            obj.find('input[name="s"]').val('');
        }
        if (obj.find('.prdctfltr_buttons input[name="sale_products"]').length > 0) {
            obj.find('.prdctfltr_buttons input[name="sale_products"]').remove();
        }
        if (obj.find('.prdctfltr_buttons input[name="instock_products"]').length > 0) {
            obj.find('.prdctfltr_buttons input[name="instock_products"]').remove();
        }
        if (obj.find('.prdctfltr_add_inputs input[name="orderby"]').length > 0) {
            obj.find('.prdctfltr_add_inputs input[name="orderby"]').remove();
        }

        obj.find('input[name="reset_filter"]').remove();

    }

    function checkAddInputs(obj) {

        obj.find('.prdctfltr_attributes label.prdctfltr_active input[value]').each(function() {

            var eVal = $(this).val();
            var nVal = $(this).closest('.prdctfltr_attributes').attr('data-filter');

            $('.prdctfltr_wc .prdctfltr_add_inputs .pf_added_input[name="' + nVal + '"]').each(function() {
                if ($(this).val().indexOf(eVal) > -1) {
                    if ($(this).val().indexOf(',') > -1 || $(this).val().indexOf('+') > -1) {
                        $(this).val($(this).val().replace(',' + eVal, '').replace(eVal + ',', ''));
                    } else {
                        $(this).val('');
                    }

                }
            });

            $.each(prdctfltr.js_filters, function(n18, obj43) {
                if (typeof obj43.adds !== 'undefined' && typeof obj43.adds[nVal] !== 'undefined') {
                    delete prdctfltr.js_filters[n18].adds[nVal];
                }
            });

        });

    }

    function prdctfltr_remove_empty_inputs_550(obj) {

        obj.find('.prdctfltr_filter input[type="hidden"], .prdctfltr_filter input.pf_search, .prdctfltr_add_inputs input[type="hidden"]').each(function() {

            var curr_val = $(this).val();

            if (curr_val === '') {
                if ($(this).is(':visible')) {
                    $(this).prop('disabled', true).attr('disabled', 'true');
                } else {
                    $(this).remove();
                }
            }

        });

    }

    function prdctfltr_remove_ranges_550(obj) {
        obj.find('.prdctfltr_filter.prdctfltr_range').each(function() {
            var curr_rng = $(this);
            if (curr_rng.find('[name^="rng_min_"]').val() == undefined || curr_rng.find('[name^="rng_max_"]').val() == undefined) {
                curr_rng.find('input').remove();
            }
        });
    }

    function __deflate_body_class() {
        if ( $('body.wc-prdctfltr-active').length>0 ) {
            $('body.wc-prdctfltr-active').addClass('wc-prdctfltr-deflate').removeClass('wc-prdctfltr-active');
            rClass('wc-prdctfltr-deflate', $('body'));
        }
    }

    function prdctfltr_check_display_800(obj) {
        __deflate_body_class();
        hideOverlay();
    }

    function prdctfltr_post_analytics(curr_fields) {
        if ($.isEmptyObject(curr_fields) === false) {
            var data = {};

            $.each(curr_fields, function(i, o) {
                if ($.isEmptyObject(o) === false) {
                    $.each(o, function(i2, o2) {
                        if ($.inArray(i2, ['rng_min_price', 'rng_max_price', 'sale_products', 'instock_products', 'orderby', 'vendor', 'min_price', 'max_price', 'products_per_page']) == -1 && i2.substring(0, 4) !== 'rng_' && i2.substring(0, 4) !== 'mta_') {
                            if (typeof data[i2] === 'undefined') {
                                data[i2] = o2;
                            }
                        }
                    });
                }
            });

            var analyticsData = {
                action: 'prdctfltr_analytics',
                filters: data,
                pf_nonce: $('.prdctfltr_wc[data-nonce]:first').attr('data-nonce'),
            };

            $.ajax({
                type: 'POST',
                url: prdctfltr.ajax,
                data: analyticsData,
                success: function() {},
                error: function() {},
            });
        }
    }

    function prdctfltr_get_fields_550(obj) {

        var curr_fields = {};

        if (obj.css('display') === 'none') {
            return curr_fields;
        }

        var lookAt = '.prdctfltr_filter input[type="hidden"], .prdctfltr_filter input.pf_search, .prdctfltr_add_inputs input[name="orderby"], .prdctfltr_add_inputs input[name="s"], .prdctfltr_add_inputs input.pf_added_input';

        obj.find(lookAt).each(function() {
            if ($(this).val() !== '') {
                curr_fields[$(this).attr('name')] = $(this).val();
            }
        });

        if (obj.find('.prdctfltr_buttons input[name="sale_products"]:checked').length > 0) {
            curr_fields.sale_products = 'on';
        }
        if (obj.find('.prdctfltr_buttons input[name="instock_products"]:checked').length > 0) {
            curr_fields.instock_products = obj.find('.prdctfltr_buttons:first input[name="instock_products"]:checked').val();
        }

        return curr_fields;

    }

    var infiniteWasReset = false;

    function after_ajax(curr_next) {

        function AAscrollHandler() {

            if (infiniteLoad.find('a.disabled').length == 0 && $(window).scrollTop() >= infiniteLoad.position().top - $(window).height() * 0.8) {
                infiniteLoad.find('a:not(.disabled)').trigger('click');
            }

        };

        $.each(curr_next, function(b, setView) {
            setView = $(setView);

            infiniteLoad = $('.prdctfltr-pagination-infinite-load');
            if (infiniteLoad.length > 0) {
                if (infiniteLoad.find('.button.disabled').length > 0) {

                    scrollInterval = null;
                    infiniteWasReset = true;
                } else {
                    if (infiniteWasReset) {
                        scrollInterval = setInterval(function() {
                            if (didScroll) {
                                didScroll = false;
                                if (ajaxActive !== false || historyActive !== false) {
                                    return false;
                                }
                                AAscrollHandler();
                            }
                        }, 250);
                    }
                }
            }


            if (setView.hasClass('pf_after_ajax')) {
                return false;
            }
            setView.addClass('pf_after_ajax');

            if (setView.find('.prdctfltr_expand_parents').length > 0) {
                prdctfltr_all_cats(setView);
            } else {
                prdctfltr_show_opened_cats(setView);
            }

            prdctfltr_init_tooltips(setView);
            reorder_selected(setView);
            reorder_adoptive(setView);
            set_select_index(setView);
            init_search(setView);
            init_ranges(setView);
            do_zindexes(setView);
            prdctfltr_tabbed_selection(setView);

            __deflate_body_class();

            if (setView.hasClass('prdctfltr_step_filter')) {
                if (setView.find('.prdctfltr_woocommerce_filter_submit').length > 0) {
                    setView.find('.prdctfltr_woocommerce_filter_submit').remove();
                }
                setView.find('.prdctfltr_buttons').prepend('<a class="button prdctfltr_woocommerce_filter_submit pf_stopajax" href="#">' + (prdctfltr.js_filters[setView.attr('data-id')].button_text === '' ? prdctfltr.localization.getproducts : prdctfltr.js_filters[setView.attr('data-id')].button_text) + '</a>');
                setView.closest('prdctfltr_sc').addClass('prdctfltr_sc_step_filter');
            }

            prdctfltr_filter_terms_init(setView);

            get_category_mode(setView);
            prdctfltr_added_check(setView);
            prdctfltr_make_clears(setView);

            setView.find('.prdctfltr_filter').each(function() {
                check_selection_boxes($(this), 'init');
            });

            setView.find('.prdctfltr_buttons:first label.prdctfltr_active').each(function() {
                check_buttons($(this), 'init');
            });

            prdctfltr_show_opened_widgets(setView);

            __check_masonry(setView);

            _fix_system_selects(setView);
            _fix_search_selects(setView);
            reorder_limit(setView);
            product_filter_accessibility(setView);


            // вызываем функцию после обновления
            colorsLink();


            

        });

    }

    // Функция для дополнения цветов и удаления предыдущего атрибута
function colorsLink() {
    let allColors = document.querySelectorAll('.prdctfltr_pa_color input'),
        allProducts = document.querySelectorAll('.woocommerce-loop-product__link'),
        currentColor = '';

    allColors.forEach(color => {
        if (color.checked) {
            currentColor = color.value;

            allProducts.forEach(product => {
                let productLink = product.getAttribute('href');

                // Убираем первый "attribute_pa_color", если он есть
                let cleanedLink = productLink.replace(/([?&])attribute_pa_color=[^&]+/, '$1');

                // Проверяем, не добавлен ли уже параметр attribute_pa_color, и добавляем новый
                product.href = `${cleanedLink}${cleanedLink.includes('?') ? '&' : '?'}attribute_pa_color=${currentColor}`;
            });
        }
    });
}

// Функция для дополнения цветов и удаления предыдущего атрибута
function colorsLink() {
    let allColors = document.querySelectorAll('.prdctfltr_pa_color input'),
        allProducts = document.querySelectorAll('.woocommerce-loop-product__link'),
        currentColor = '';

    allColors.forEach(color => {
        if (color.checked) {
            currentColor = color.value;

            allProducts.forEach(product => {
                let productLink = product.getAttribute('href');

                // Убираем первый "attribute_pa_color", если он есть
                let cleanedLink = productLink.replace(/([?&])attribute_pa_color=[^&]+/, '$1');

                // Проверяем, не добавлен ли уже параметр attribute_pa_color, и добавляем новый
                product.href = `${cleanedLink}${cleanedLink.includes('?') ? '&' : '?'}attribute_pa_color=${currentColor}`;
            });
        }
    });
}

// Вызываем функцию, когда фильтр изменяется (например, при выборе цвета)
document.addEventListener('DOMContentLoaded', function() {
    colorsLink();

    // Если фильтр меняется динамически, добавьте обработчик события
    document.querySelectorAll('.prdctfltr_pa_color input').forEach(input => {
        input.addEventListener('change', colorsLink);
    });
});



    var pf_paged = 1;
    var pf_offset = 0;
    var pf_restrict = '';

    $(document).on('click', '.prdctfltr_sc_products.prdctfltr_ajax ' + prdctfltr.ajax_pagination_class + ' a, body.prdctfltr-ajax.prdctfltr-shop ' + prdctfltr.ajax_pagination_class + ' a, .prdctfltr-pagination-default a, .prdctfltr-pagination-load-more a', function() {

        if (ajaxActive === true) {
            return false;
        }

        ajaxActive = true;

        var loadMore = ($(this).closest('.prdctfltr-pagination-load-more').length > 0 ? true : false);
        var curr_link = $(this);

        var shortcodeAjax = false;
        var checkShortcode = curr_link.closest('.prdctfltr_sc_products');

        if (archiveAjax === false && checkShortcode.length > 0 && checkShortcode.hasClass('prdctfltr_ajax')) {
            shortcodeAjax = true;
            var obj = checkShortcode.find('form:first');
        } else {
            var obj = $('div:not(.prdctfltr_sc_products) .prdctfltr_wc:not(.prdctfltr_step_filter):first form');
        }

        if (obj.length == 0) {
            obj = $('.prdctfltr_wc_widget').find('form:first');
        }

        var curr_href = curr_link.attr('href');

        if (loadMore === true) {
            $(this).closest('.prdctfltr-pagination-load-more').addClass('prdctfltr-ignite');
            if (shortcodeAjax === false) {
                pf_offset = parseInt($(prdctfltr.ajax_class).find(prdctfltr.ajax_product_class).length, 10);
            } else {
                pf_offset = parseInt(checkShortcode.find(prdctfltr.ajax_product_class).length, 10);
            }
        } else {
            if (curr_href.indexOf('paged=') >= 0) {
                pf_paged = parseInt(curr_href.getValueByKey('paged'), 10);
            } else if (curr_href.indexOf('product-page=') >= 0) {
                pf_paged = parseInt(curr_href.getValueByKey('product-page'), 10);
            } else {
                var arrUrl = curr_href.split('/' + prdctfltr.page_rewrite + '/');
                if (typeof arrUrl[1] !== 'undefined') {
                    if (arrUrl[1].indexOf('/') > 0) {
                        arrUrl[1] = arrUrl[1].substring(0, arrUrl[1].indexOf('/'));
                    }
                    pf_paged = parseInt(arrUrl[1], 10);
                }
            }
        }

        pf_restrict = 'pagination';

        ajaxActive = false;
        prdctfltr_respond_550(obj);

        return false;

    });

    function get_shortcode(id) {
        var wrf = {};
        if (typeof prdctfltr.pagefilters[id].wcsc !== 'undefined' && prdctfltr.pagefilters[id].wcsc === true) {
            wrf = prdctfltr.pagefilters[id].atts;
        }
        $.each(prdctfltr.pagefilters, function(i, o) {
            if (i !== id) {
                if (typeof prdctfltr.pagefilters[i].wcsc !== 'undefined' && prdctfltr.pagefilters[i].wcsc === true) {
                    wrf = prdctfltr.pagefilters[i].atts;
                }
            }
        });
        return wrf;
    }

    prdctfltr.widgetTitle = null;

    function __get_widget_title() {
        if ( prdctfltr.widgetTitle == null ) {
            var widget = $('.prdctfltr_wc_widget:first');

            var rpl = $('<div></div>').append(widget.find('.pf-help-title:first').clone()).html().toString().replace(/\t/g, '');
            var rpl_off = $('<div></div>').append(widget.find('.pf-help-title:first').find('.prdctfltr_widget_title').clone()).html().toString().replace(/\t/g, '');

            rpl = rpl.replace(rpl_off, '%%%');

            rpl = rpl.replace('<div class="pf-help-title">', '');
            rpl = rpl.substring(0, rpl.length - 6);

            prdctfltr.widgetTitle = $.trim(rpl);
        }

        return prdctfltr.widgetTitle;
    }

    function prdctfltr_respond_550(curr) {

        if (ajaxActive === true) {
            return false;
        }

        ajaxActive = true;

        var curr_filter = curr.closest('.prdctfltr_wc');

        var ourObj = prdctfltr_get_obj_580(curr_filter);
        var pf_length = prdctfltr_count_obj_580(ourObj);
        var or_length = pf_length;

        if (!curr.closest('.prdctfltr_wc').hasClass('prdctfltr_step_filter') && archiveAjax === true) {
            $(prdctfltr.ajax_class + ':first').fadeTo(200, 0.5).addClass('prdctfltr_faded');
        }

        if (prodcutsWrapper !== false) {
            prodcutsWrapper.fadeTo(200, 0.5).addClass('prdctfltr_faded');
        }

        if (stopAjax === true) {
            shortcodeAjax = false;
            archiveAjax = false;
            stopAjax = false;
        }

        var curr_fields = {};
        var requested_filters = {};

        prdctfltr_get_loader(curr);
        $(document).trigger('prdctfltr-loading');

        $.each(ourObj, function(i, obj) {

            obj = $(obj);

            if (obj.find('input[name="reset_filter"]:checked').length > 0) {
                prdctfltr_reset_filters_550(obj);
            } else {
                prdctfltr_remove_empty_inputs_550(obj);
            }

            var pf_id = obj.attr('data-id');

            prdctfltr_remove_ranges_550(obj);

            prdctfltr_check_display_800(obj);

            if (!obj.hasClass('prdctfltr_mobile')) {
                requested_filters[pf_id] = pf_id;
            }

            if (!--pf_length) {

                $.each(ourObj, function(i, obj1) {
                    curr_fields[$(obj1).attr('data-id')] = prdctfltr_get_fields_550(obj1);
                    prdctfltr.active_filtering.active = curr_fields[$(obj1).attr('data-id')];
                });

                if (prdctfltr.analytics === 'yes') {
                    setTimeout(function() {
                        prdctfltr_post_analytics(curr_fields);
                    }, 250);
                }

                if (archiveAjax === true || shortcodeAjax === true) {

                    var pf_set = 'archive';
                    if (archiveAjax === true && !$('body').hasClass('prdctfltr-shop')) {
                        pf_set = 'shortcode';
                    } else {
                        pf_set = (archiveAjax === true ? 'archive' : 'shortcode');
                    }

                    var data = {
                        action: 'prdctfltr_respond_550',
                        pf_url: location.protocol + '//' + location.host + location.pathname,
                        pf_request: prdctfltr.js_filters,
                        pf_requested: requested_filters,
                        pf_shortcode: prdctfltr.js_filters[pf_id].atts,
                        pf_filters: curr_fields,
                        pf_set: pf_set,
                        pf_id: pf_id,
                        pf_paged: pf_paged,
                        pf_pagefilters: prdctfltr.pagefilters,
                        pf_restrict: pf_restrict,
                        pf_bulk: _get_pf_bulk(),
                        pf_active_variations: _get_active_variations(),
                    };

                    if ($('.prdctfltr_wc_widget').length>0) {
                        data.pf_widget_title = __get_widget_title();
                    }

                    if (typeof obj.attr('data-lang') !== 'undefined') {
                        data.lang = obj.attr('data-lang');
                    }

                    if (pf_offset > 0) {
                        data.pf_offset = pf_offset;
                    }

                    if ($(prdctfltr.ajax_orderby_class).length > 0) {
                        data.pf_orderby_template = 'set';
                    }

                    if ($(prdctfltr.ajax_count_class).length > 0) {
                        data.pf_count_template = 'set';
                    }

                    if (or_length == 1 && obj.hasClass('prdctfltr_step_filter')) {
                        data.pf_step = 1;
                        data.pf_set = 'shortcode';
                    }

                    if (pf_set === 'shortcode') {
                        if (prdctfltr.active_sc !== '') {
                            data.pf_active = prdctfltr.active_sc;
                        }
                    }

                    curr_filter.find('.pf_added_input').each(function() {
                        if (typeof data.pf_adds === 'undefined') {
                            data.pf_adds = {};
                        }
                        data.pf_adds[$(this).attr('name')] = $(this).val();
                    });

                    $.ajax({
                        type: 'POST',
                        url: prdctfltr.ajax,
                        data: data,
                        success: function(response) {
                            if (response) {
                                if (pf_offset > 0) {
                                    response.offset = pf_offset;
                                }
                                var getElement = shortcodeAjax === true ? prodcutsWrapper : false;
                                prdctfltr_handle_response_580(response, archiveAjax, shortcodeAjax, getElement);
                            }
                        },
                        error: function(response) {
                            alert('Error!');
                        }
                    });

                } else {

                    obj.find('.prdctfltr_filter input[type="hidden"]:not([name="post_type"]), .prdctfltr_filter input[name="s"], .prdctfltr_filter input[name="sale_products"], .prdctfltr_filter input[name="instock_products"]').each(function() {
                        obj.find('input[name="' + this.name + '"]:gt(0)').remove();
                    });

                    if (Object.keys(curr_fields).length > 1) {
                        $.each(curr_fields, function(e1, w1) {
                            $.each(w1, function(k02, s02) {
                                if (k02 != 's' && obj.find('input[name="' + k02 + '"]').length == 0) {
                                    obj.find('.prdctfltr_add_inputs').append('<input type="hidden" name="' + k02 + '" value="' + s02 + '" class="pf_added_input" />');
                                } else if (k02 != 's' && obj.find('input[name="' + k02 + '"]').length > 0) {
                                    obj.find('input[type="hidden"][name="' + k02 + '"]').val(s02);
                                }
                                if (k02 === 's' && obj.find('input[name="s"]').length == 0) {
                                    obj.find('.prdctfltr_add_inputs').append('<input type="hidden" name="s" value="' + s02 + '" class="pf_added_input" />');
                                }
                            });
                        });
                    }

                    if ($('.prdctfltr_wc input[name="orderby"][value="' + prdctfltr.orderby + '"]').length > 0) {
                        $('.prdctfltr_wc input[name="orderby"][value="' + prdctfltr.orderby + '"]').remove();
                    }

                    obj.find('.prdctfltr_woocommerce_ordering').submit();

                }

            }

        });

    }

    function _get_active_variations() {
        var activeVariations = [];

        if ( prdctfltr.active_filtering.variable.length>0 ) {
            for(var n=0;n<prdctfltr.active_filtering.variable.length;n++) {
                activeVariations.push(prdctfltr.active_filtering.variable[n]._id);
            }
        }

        return activeVariations;
    }

    function _get_pf_bulk() {
        if ( typeof prdctfltr.bulk === 'undefined' ) {
            prdctfltr.bulk = $('.bulk-add-to-cart-tool').length > 0 ? true : false;
        }
    
        return prdctfltr.bulk;
    }

    function u(e) {
        return typeof e === 'undefined' ? false : e;
    }

    var handleResponse = {

        pl_loops_products : function(products, response, obj2) {
            var obj3 = ($(obj2).find(prdctfltr.ajax_class).length > 0 ? $(obj2).find(prdctfltr.ajax_class) : $(obj2));
        
            if (products.find('.pl-loops').length > 0) {
                products = products.find('.pl-loops:first');
            }
        
            if (products.is('.pl-loops') && products.data('isotope')) {
                if (typeof response.offset === 'undefined') {
                    products.isotope('remove', products.data('isotope').element.children);
                }
        
                if (obj3.find(prdctfltr.ajax_product_class).length > 0) {
                    products.isotope('insert', obj3.find(prdctfltr.ajax_product_class));
                } else {
                    products.isotope('insert', obj3);
                }
        
                var container = products;
                container.imagesLoaded(function() {
                    products.isotope('layout');
                });
            } else {
                if (obj3.length < 1) {
                    products.empty();
                } else {
                    if (typeof response.offset === 'undefined') {
                        if (obj3.find(prdctfltr.ajax_product_class).length > 0 || obj3.find(prdctfltr.ajax_category_class).length > 0) {
                            pf_animate_products(products, obj3, 'replace');
                        } else {
                            if (products.data('isotope')) {
                                products.isotope('remove', products.data('isotope').element.children);
                                products.isotope('insert', obj3);
                            } else {
                                products.empty().append(obj3[0].innerHTML);
                            }
                        }
        
                        // Добавляем логику для вывода ID вариаций
                        obj3.find(prdctfltr.ajax_product_class).each(function() {
                            var product = $(this);
                            var variations = product.data('variations');  // Предполагается, что данные о вариациях передаются в HTML-атрибуте 'data-variations'
        
                            if (variations) {
                                variations.forEach(function(variation) {
                                    product.append('<div>Variation ID: ' + variation.id + '</div>');
                                });
                            }
                        });
        
                    } else {
                        if (obj3.find(prdctfltr.ajax_product_class).length > 0 || obj3.find(prdctfltr.ajax_category_class).length > 0) {
                            pf_animate_products(products, obj3, historyActive === false ? 'append' : 'replace');
                        }
                        response.products = $('<div></div>').append(products.clone().removeAttr('style').removeClass('prdctfltr_faded')).html();
                    }
                }
            }
        },
        

        products : function(response,products) {
            if (isStep) {
                return false;
            }
            var obj2 = response.products;

            if (!isStep) {

                this.pl_loops_products(products,response,obj2);

                if ($(obj2).find(prdctfltr.ajax_count_class).length > 0) {
                    response.count = $(obj2).find(prdctfltr.ajax_count_class).outerHTML();
                }

                $('.prdctfltr_faded').fadeTo(200, 1).removeClass('prdctfltr_faded');

                setTimeout(function() {
                    pf_get_scroll(products, 0);
                }, 200);

            }
        },

        pagination: function(obj2,getElement,shortcodeAjax,products) {
            
            getElement === false ? $(prdctfltr.ajax_class + ':first') : getElement.find(prdctfltr.ajax_class);

            if (archiveAjax === true && $('body').hasClass('prdctfltr-shop')) {
                var pagination = (prdctfltr.ajax_pagination_type === 'default' ? $(prdctfltr.ajax_pagination_class) : $('.' + prdctfltr.ajax_pagination_type));
            } else if (shortcodeAjax === true) {
                if (getElement === false) {
                    getElement = $(prdctfltr.ajax_class + ':first');
                }

                var pagination = getElement.find(prdctfltr.ajax_pagination_class);
                if (pagination.length < 1) {
                    pagination = getElement.find('.prdctfltr-pagination-default');
                }
                if (pagination.length < 1) {
                    pagination = getElement.find('.prdctfltr-pagination-load-more');
                }
                if (pagination.length < 1) {
                    pagination = $(prdctfltr.ajax_pagination_class);
                }
            } else if (shortcodeAjax === false) {
                var pagination = $(prdctfltr.ajax_pagination_class);
                if (pagination.length < 1) {
                    pagination = $('.prdctfltr-pagination-default');
                }
                if (pagination.length < 1) {
                    pagination = $('.prdctfltr-pagination-load-more');
                }
            }

            if (!isStep && typeof products !== 'undefined' && products.find(prdctfltr.ajax_product_class).length > 0) {

                obj2 = $(obj2);

                if (obj2 !== '') {
                    if (pagination.length < 1) {
                        if ($('.pf_pagination_dummy').length == 0) {
                            if (shortcodeAjax === true) {
                                getElement.find(prdctfltr.ajax_class + ':first').after('<div class="pf_pagination_dummy"></div>');
                            } else {
                                $(prdctfltr.ajax_class + ':first').after('<div class="pf_pagination_dummy"></div>');
                            }
                        }

                        pagination = $('.pf_pagination_dummy');
                    }
                }

                if (obj2.length < 1) {
                    pagination.empty();
                } else {
                    $.each(pagination, function() {
                        $(this).replaceWith(obj2[0].outerHTML);
                    });
                }

            } else {
                pagination.empty();
            }
        },

        query: function(obj2) {
            if (prdctfltr.permalinks !== 'yes') {
                return (obj2 === '' ? location.protocol + '//' + location.host + location.pathname : obj2);
            } else {
                return location.protocol + '//' + location.host + location.pathname;
            }
        },

        objResponse : {

            js_filters: function(obj2) {
                obj2 = $(obj2);
                $.each(obj2[0], function(i, f) {
                    prdctfltr.js_filters[i] = f;
                });
            },
    
            prdctfltr: function(obj2) {
                obj2 = $(obj2);
                prdctfltr = obj2[0];
            },
        
            ranges: function(obj2) {
                obj2 = $(obj2);
                prdctfltr.rangefilters = obj2[0];
            },
    
            orderby: function(obj2) {
                obj2 = $(obj2);
    
                $.each($(prdctfltr.ajax_orderby_class), function() {
                    $(this).replaceWith(obj2[0].outerHTML);
                });
            },
    
            count: function(obj2) {
                obj2 = $(obj2);
    
                if (obj2.length < 1) {
                    $(prdctfltr.ajax_count_class).html(prdctfltr.localization.noproducts);
                } else {
                    $.each($(prdctfltr.ajax_count_class), function() {
                        $(this).replaceWith(obj2[0].outerHTML);
                    });
                }
            },
    
            breadcrumbs: function(obj2) {
                if ($('.woocommerce-breadcrumb').length > 0 && obj2 !== '') {
                    obj2 = $(obj2);
     
                    $.each($('.woocommerce-breadcrumb'), function() {
                        $(this).html(obj2[0].innerHTML);
                    });
                }
            },

            title: function(obj2) {
                if ($('h1').length > 0 && obj2 !== '') {
                    obj2 = $(obj2);
     
                    $.each($('h1'), function() {
                        $(this).html(obj2[0].innerHTML);
                    });
                }
            },
    
            desc: function(obj2) {
                if (pf_paged < 2 && obj2 !== '') {
                    if ($('.term-description').length > 0) {
                        obj2 = $(obj2);
                        $.each($('.term-description'), function() {
                            $(this).html(obj2[0].innerHTML);
                        });
    
                    } else if ($('.page-description').length > 0) {
                        obj2 = $(obj2);
                        $.each($('.page-description'), function() {
                            $(this).html(obj2[0].innerHTML);
                        });
    
                    } else if ($('.woocommerce-products-header').length > 0) {
                        $.each($('.woocommerce-products-header h1'), function() {
                            $(this).after(obj2);
                        });
                    }
                } else {
                    if ($('.term-description').length > 0) {
    
                        $.each($('.term-description'), function() {
                            $(this).html('');
                        });
    
                    }
                    if ($('.page-description').length > 0) {
    
                        $.each($('.page-description'), function() {
                            $(this).html('');
                        });
    
                    }
                }
            },
    
            active_filtering: function(obj2) {
                if ( prdctfltr.active_filtering.variable === false ) {
                    prdctfltr.active_filtering.variable = [];
                }

                if ( u(obj2.variable) ) {
                    for(var n=0;n<obj2.variable.length;n++) {
                        prdctfltr.active_filtering.variable.push(obj2.variable[n]);
                    }
                }
            },

        },

        product_filter: function(r) {

            for (var n in r.product_filter) {

                var id = r.product_filter[n].id;
                var objFilter = r.product_filter[n].filter;

                objFilter = $(objFilter);

                if (objFilter.hasClass('prdctfltr_wc')) {
                    if (pf_offset > 0 && $(r.products).find(prdctfltr.ajax_product_class).length > 0 || pf_offset == 0) {
                        if ($('.prdctfltr_wc[data-id="' + id + '"]').length > 0) {
                            $('.prdctfltr_wc[data-id="' + id + '"]').replaceWith(objFilter);
                            ajaxRefresh[id] = id;
                        }
                    } else {
                        $('.prdctfltr_wc[data-id="' + id + '"]').find('.prdctfltr_woocommerce_filter').replaceWith(objFilter.find('.prdctfltr_woocommerce_filter'));
                    }
                    if ($('.prdctfltr_wc[data-id="' + id + '"] + .prdctfltr_mobile + .prdctfltr_mobile').length > 0) {
                        $('.prdctfltr_wc[data-id="' + id + '"] + .prdctfltr_mobile + .prdctfltr_mobile').remove();
                    }
                } else if (objFilter.hasClass('prdctfltr-widget')) {
                    if ($('.prdctfltr_wc[data-id="' + id + '"]').length > 0) {
                        $('.prdctfltr_wc[data-id="' + id + '"]').closest('.prdctfltr-widget').replaceWith(objFilter);
                        ajaxRefresh[id] = id;
                    }
                }

            }

        },

    }

    var ajaxRefresh = {};

    function prdctfltr_handle_response_580(response, archiveAjax, shortcodeAjax, getElement) {
        ajaxRefresh = {};
        var responseLength = prdctfltr_count_obj_580(response);

        loaderStopAnimation();

        if (archiveAjax === true) {
            var products = $(prdctfltr.ajax_class + ':first');
        } else if (shortcodeAjax === true) {
            var products = getElement === false ? $(prdctfltr.ajax_class + ':first') : getElement.find(prdctfltr.ajax_class);
        } else {
            var products = $(prdctfltr.ajax_class + ':first');
        }

        if ( u(products) && u(response.products) ) {
            handleResponse.products(response,products);
        }

        if ( u(response.product_filter) ) {
            handleResponse.product_filter(response);
        }

        handleResponse.pagination(u(response.pagination),getElement,shortcodeAjax,u(products));

        var query = '';
        if ( u(response.query) ) {
            query = handleResponse.query(response.query);
        }

        for (var n in response) {
            if (response.hasOwnProperty(n)) {
                u(handleResponse.objResponse[n]) && handleResponse.objResponse[n](response[n]);
            }

            if (!--responseLength) {

                if (!$.isEmptyObject(ajaxRefresh)) {
                    $.each(ajaxRefresh, function(m, obj4) {
                        after_ajax($('.prdctfltr_wc[data-id="' + m + '"]'));
                        if ($('.prdctfltr_wc[data-id="' + m + '"]').next().is('.prdctfltr_mobile')) {
                            after_ajax($('.prdctfltr_wc[data-id="' + m + '"]').next());
                        }
                    });
                }

                $(document.body).trigger('post-load');
                $(document).trigger('prdctfltr-reload');

                if (prdctfltr.js !== '') {
                    eval(prdctfltr.js);
                }

                if (historyActive === false && (archiveAjax || $('body').hasClass('prdctfltr-sc')) === true /*&& pf_offset == 0*/ ) {
                    if (query.indexOf('https:') > -1 && location.protocol != 'https:') {
                        query = query.replace('https:', 'http:');
                    } else if (query.indexOf('http:') > -1 && location.protocol != 'http:') {
                        query = query.replace('http:', 'https:');
                    }

                    if (pf_offset > 0) {
                        query += query.indexOf('?') > -1 ? '&offset=' + pf_offset : '?offset=' + pf_offset;
                    }

                    var historyId = guid();

                    makeHistory[historyId] = response;
                    makeHistory[historyId].prdctfltr = prdctfltr;
                    history.pushState({ filters: historyId, archiveAjax: archiveAjax, shortcodeAjax: shortcodeAjax }, document.title, query);
                }

                ajaxActive = false;
                pf_paged = 1;
                pf_offset = 0;
                pf_restrict = '';

            }

        }

    }

    $(document).on( 'prdctfltr-reload', function() {
        active_filtering();
    } );

    var historyActive = false;

    if (archiveAjax === true || $('body').hasClass('prdctfltr-sc')) {

        window.addEventListener('popstate', function(e) {
            if (ajaxActive === false && historyActive === false) {
                historyActive = true;
                ajaxActive = true;
                var state = typeof history.state != 'undefined' ? history.state : null;
                if (state != null) {
                    if (typeof state.filters !== 'undefined' && typeof makeHistory[state.filters] !== 'undefined') {
                        prdctfltr_handle_response_580(makeHistory[state.filters], state.archiveAjax, state.shortcodeAjax, false);
                    } else if (typeof pageFilters !== 'undefined') {
                        prdctfltr_handle_response_580(pageFilters, ($('body').hasClass('prdctfltr-ajax') || $('body').hasClass('prdctfltr-sc') ? true : false), false, false);
                    }
                }
                setTimeout(function() {
                    historyActive = false;
                }, 500);
            }
        });
    }

    if ((/Trident\/7\./).test(navigator.userAgent)) {
        $(document).on('click', '.prdctfltr_checkboxes label img', function() {
            $(this).parents('label').children('input:first').change().click();
        });
    }

    if ((/Trident\/4\./).test(navigator.userAgent)) {
        $(document).on('click', '.prdctfltr_checkboxes label > span > img, .prdctfltr_checkboxes label > span', function() {
            $(this).parents('label').children('input:first').change().click();
        });
    }

    function prdctfltr_filter_results(currThis, list, searchIn, curr_filter) {

        var filter = currThis.val();
        var curr = currThis.closest('.prdctfltr_filter');

        if (filter) {

            if (curr.find('div.prdctfltr_sub').length > 0) {
                $(list).find('.prdctfltr_sub').prev().addClass('prdctfltr_show_subs');
                if (curr.hasClass('prdctfltr_searching') === false) {
                    curr.addClass('prdctfltr_searching');
                }
            }
            $(list).find(searchIn + ' > span:not(:Contains(' + filter + '))').closest('label').attr('style', 'display:none !important');
            $(list).find(searchIn + ' > span:Contains(' + filter + ')').closest('label').show();
            curr.find('.pf_more').hide();

        } else {

            if (curr.find('div.prdctfltr_sub').length > 0) {
                $(list).find('.prdctfltr_sub').prev().removeClass('prdctfltr_show_subs');
            }

            curr.removeClass('prdctfltr_searching');
            $(list).find(searchIn).show();

            var checkboxes = curr.find('.prdctfltr_checkboxes');

            checkboxes.each(function() {
                var max = parseInt(curr.attr('data-limit'), 10);
                if (max > 0 && $(list).find(searchIn).length > max) {
                    $(list).find(searchIn).slice(max).attr('style', 'display:none !important');
                    $(list).find('.pf_more').html('<span>' + prdctfltr.localization.show_more + '</span>').removeClass('pf_activated');
                }
            });
            curr.find('.pf_more').show();
        }

        if (curr.hasClass('prdctfltr_expand_parents')) {
            prdctfltr_all_cats(curr_filter);
        }

        return false;
    }

    function prdctfltr_filter_terms_init(curr) {
        curr = (curr == null ? $('.prdctfltr_woocommerce') : curr);

        curr.find('.prdctfltr_add_search:not(.prdctfltr_terms_customized_system,.prdctfltr_terms_customized_selectize) .prdctfltr_add_scroll').each(function() {
            var list = $(this);
            prdctfltr_filter_terms(list);
        });
    }

    function prdctfltr_filter_terms(list) {

        var curr_filter = list.closest('.prdctfltr_wc');
        var form = $("<div>").attr({ "class": "prdctfltr_search_terms", "action": "#" });
        var input = $("<input>").attr({ "class": "prdctfltr_search_terms_input", "type": "text", "placeholder": prdctfltr.localization.filter_terms });

        if (curr_filter.hasClass('pf_select') || curr_filter.hasClass('pf_default_select') || list.closest('.prdctfltr_filter').hasClass('prdctfltr_terms_customized_select')) {
            $(form).append(input).prependTo(list);
        } else {
            $(form).append(input).insertBefore(list);
        }

        if (list.closest('.prdctfltr_filter').hasClass('pf_adptv_default')) {
            var searchIn = 'label:not(.pf_adoptive_hide)';
        } else {
            var searchIn = 'label';
        }

        var timeoutId = 0;

        $(input).change(function() {

                var filter = $(this);

                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() { prdctfltr_filter_results(filter, list, searchIn, curr_filter); }, 500);

            })
            .keyup(function() {
                $(this).change();
            });

    }

    $(document).on('click', '.prdctfltr_sc_products ' + prdctfltr.ajax_class + ' ' + prdctfltr.ajax_category_class + ' a, .prdctfltr-shop.prdctfltr-ajax ' + prdctfltr.ajax_class + ' ' + prdctfltr.ajax_category_class + ' a', function() {

        if (ajaxActive === true) {
            return false;
        }

        var curr = $(this).closest(prdctfltr.ajax_category_class);

        var curr_sc = (curr.closest('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter)').length > 0 ? curr.closest('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter)') : $('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter):first').length > 0 ? $('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter):first') : $('.prdctfltr_woocommerce:not(.prdctfltr_step_filter):first').length > 0 ? $('.prdctfltr_woocommerce:not(.prdctfltr_step_filter):first') : 'none');

        if (curr_sc === 'none') {
            return;
        }

        if (curr_sc.hasClass('prdctfltr_sc_products')) {
            var curr_filter = (curr_sc.find('.prdctfltr_woocommerce:not(.prdctfltr_step_filter)').length > 0 ? curr_sc.find('.prdctfltr_woocommerce:not(.prdctfltr_step_filter):not(.prdctfltr_mobile)') : $('.prdctfltr-widget').find('.prdctfltr_woocommerce:not(.prdctfltr_mobile)'));
        } else if ($('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter)').length == 0) {
            var curr_filter = curr_sc;
        } else {
            return;
        }

        var cat = curr.find('.prdctfltr_cat_support').data('slug');

        var hasFilter = curr_filter.find('.prdctfltr_filter[data-filter="product_cat"] input[type="checkbox"][value="' + cat + '"]:first');

        if (hasFilter.length > 0) {
            ajaxActive = true;
            $.each(curr_filter.find('.prdctfltr_filter[data-filter="product_cat"] label.prdctfltr_active'), function() {
                $(this).trigger('click');
            });
            setTimeout(function() {
                ajaxActive = false;
                hasFilter.closest('label').trigger('click');
                if (!curr_filter.hasClass('prdctfltr_click_filter')) {
                    curr_filter.find('.prdctfltr_woocommerce_filter_submit').trigger('click');
                }
            }, 25);
        } else {
            var hasField = curr_filter.find('.prdctfltr_filter[data-filter="product_cat"]');

            if (hasField.length > 0) {
                hasField.find('input[name="product_cat"]').val(cat);
            } else {
                var append = $('<input name="product_cat" type="hidden" value="' + cat + '" />');
                curr_filter.find('.prdctfltr_add_inputs').append(append);
            }

            if (!curr_filter.hasClass('prdctfltr_click_filter')) {
                curr_filter.find('.prdctfltr_woocommerce_filter_submit').trigger('click');
            } else {
                prdctfltr_respond_550(curr_filter.find('form'));
            }
        }

        return false;

    });

    if ($('body.prdctfltr-ajax ' + prdctfltr.ajax_orderby_class).length > 0) {

        if (ajaxActive === true) {
            return false;
        }

        $(document).on('submit', 'body.prdctfltr-ajax ' + prdctfltr.ajax_orderby_class, function() {
            return false;
        });

        $(document).on('change', 'body.prdctfltr-ajax ' + prdctfltr.ajax_orderby_class + ' select', function() {

            var orderVal = $(this).val();

            $('.prdctfltr_wc form').each(function() {

                if ($(this).closest('.prdctfltr_sc').length == 0) {

                    if ($(this).find('.prdctfltr_orderby input[type="checkbox"][val="' + orderVal + '"]').length > 0) {
                        $(this).find('.prdctfltr_orderby input[type="checkbox"][val="' + orderVal + '"]').trigger('click');
                    } else {
                        $(this).find('.prdctfltr_add_inputs').append('<input name="orderby" value="' + orderVal + '" />');
                        prdctfltr_respond_550($(this));
                    }

                }

            });

        });

    }

    if ($('.prdctfltr_sc.prdctfltr_ajax ' + prdctfltr.ajax_orderby_class).length > 0) {
        
        $(document).on('submit', '.prdctfltr_sc.prdctfltr_ajax ' + prdctfltr.ajax_orderby_class, function() {
            return false;
        });

        $(document).on('change', '.prdctfltr_sc.prdctfltr_ajax ' + prdctfltr.ajax_orderby_class + ' select', function() {
            if (ajaxActive === true) {
                return false;
            }

            var orderVal = $(this).val();
            var shortcodeForm = $(this).closest('.prdctfltr_sc').find('form');

            shortcodeForm.find('.prdctfltr_add_inputs').append('<input name="orderby" value="' + orderVal + '" />');
            prdctfltr_respond_550(shortcodeForm);

        });
    }



    function pf_get_scroll(products, offset) {

        var objOffset = -1;

        if (products.length == 0) {
            objOffset = $('.prdctfltr_wc:first').offset().top;
        } else {
            if (offset > 0) {

                var thisWrap = (products.find(prdctfltr.ajax_product_class + ':gt(' + (offset - 1) + ')').length > 0 ? products.find(prdctfltr.ajax_product_class + ':gt(' + (offset - 1) + ')') : products.find(prdctfltr.ajax_product_class + ':last'));

                objOffset = thisWrap.offset().top;

            } else {
                if (prdctfltr.ajax_scroll === 'products') {
                    objOffset = (products.find(prdctfltr.ajax_product_class + ':first').length > 0 ? products.find(prdctfltr.ajax_product_class + ':first').offset().top : products.offset().top);
                } else if (prdctfltr.ajax_scroll === 'top') {
                    objOffset = 0;
                } else if (prdctfltr.ajax_scroll === 'filter') {
                    if (products.closest('.prdctfltr_sc_products').find('.prdctfltr_wc').length > 0) {
                        objOffset = products.closest('.prdctfltr_sc_products').find('.prdctfltr_wc').offset().top;
                    } else {
                        objOffset = $('.prdctfltr_wc:first').offset().top;
                    }
                }
            }
        }

        if (objOffset > -1) {
            scrollTo(parseInt(objOffset, 10));
        }

    }

    function pf_animate_products(products, obj2, type) {
        var newProducts = obj2.find(prdctfltr.ajax_product_class);

        if (newProducts.length > 0) {

            if (products.data('isotope')) {
                if (type === 'replace') {
                    products.isotope('remove', products.data('isotope').element.children);
                }

                products.isotope('insert', newProducts);

                var container = products;
                container.imagesLoaded(function() {
                    products.isotope('layout');
                    $('.prdctfltr_faded').fadeTo(200, 1).removeClass('prdctfltr_faded');
                });
            } else {

                var beforeLength = products.find(prdctfltr.ajax_product_class).length;

                if (type === 'replace') {
                    products.empty();

                    var hasCats = obj2.find(prdctfltr.ajax_category_class);

                    if (hasCats.length > 0) {
                        products.append(hasCats);
                    }
                }

                products.append(newProducts);

                var addedProducts = (type === 'replace' || historyActive === true ? products.find(prdctfltr.ajax_product_class) : products.find(prdctfltr.ajax_product_class + ':gt(' + beforeLength + ')'));
                if (typeof addedProducts !== 'undefined') {

                    var dr = parseInt(prdctfltr.animation.duration, 10);
                    var dl = parseInt(prdctfltr.animation.delay, 10);

                    switch (prdctfltr.ajax_animation) {
                        case 'slide':
                            addedProducts.hide();
                            addedProducts.each(function(i) {
                                $(this).delay((i++) * dl).slideDown({ duration: dr, easing: 'linear' });
                            });
                            break;
                        case 'random':
                            addedProducts.not('.pf_faded').css('opacity', '0');
                            var interval = setInterval(function() {
                                var $ds = addedProducts.not('.pf_faded');
                                $ds.eq(Math.floor(Math.random() * $ds.length)).fadeTo(dr, 1).addClass('pf_faded');
                                if ($ds.length == 1) {
                                    clearInterval(interval);
                                }
                            }, dl);
                            break;
                        case 'none':
                            break;
                        default:
                            addedProducts.css('opacity', '0');
                            addedProducts.each(function(i) {
                                $(this).delay((i++) * dl).fadeTo(dr, 1);
                            });
                            break;
                    }
                }
            }
        }

    }

    function do_zindexes(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each(function() {
            if ($(this).hasClass('pf_select')) {
                var objCount = $(this).find('.prdctfltr_filter');
            } else {
                var objCount = $(this).find('.prdctfltr_terms_customized_select');
            }


            var c = objCount.length;
            objCount.css('z-index', function(i) {
                return c - i + 10;
            });

        });
    }
    do_zindexes();

    function prdctfltr_show_opened_widgets() {
        if ($('.prdctfltr-widget').length > 0 && $('.prdctfltr-widget .prdctfltr_error').length === 1) {
            $('.prdctfltr-widget .prdctfltr_filter').each(function() {
                let curr = $(this);
    
                const isChecked = curr.find('input[type="checkbox"]:checked').length > 0;
                const hasHiddenValue = curr.find('input[type="hidden"]:first').val() !== '';
                const hasTextValue = curr.find('input[type="text"]').val() !== '';
    
                if (isChecked || hasHiddenValue || hasTextValue) {
                    toggleFilter(curr);
                }
            });
        }
    }
    
    function toggleFilter(element) {
        element.find('.prdctfltr_widget_title .prdctfltr-down')
            .removeClass('prdctfltr-down').addClass('prdctfltr-up');
        element.find('.prdctfltr_add_scroll')
            .addClass('prdctfltr_down').show();
    }
    
    prdctfltr_show_opened_widgets();


    function prdctfltr_tabbed_selection(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each(function() {
            if ($(this).hasClass('prdctfltr_tabbed_selection')) {
                $(this).find('.prdctfltr_filter').each(function() {
                    if ($(this).find('input[type="hidden"]:first').length > 0 && $(this).find('input[type="hidden"]').val() !== '') {
                        $(this).addClass('prdctfltr_has_selection');
                    }
                    if ($(this).find('input[type="text"]:first').length > 0 && $(this).find('input[type="text"]').val() !== '') {
                        $(this).addClass('prdctfltr_has_selection');
                    }
                });
            }
        });
    }
    prdctfltr_tabbed_selection();

    function check_shortcode_search() {
        var wg = $('.prdctfltr_wc_widget');
        var sc = $('.prdctfltr_sc_products:not(.prdctfltr_sc_step_filter)');

        if (wg.length > 0 && sc.length > 0) {
            wg.each(function() {
                $(this).find('input[name="s"]').each(function() {
                    $(this).attr('name', 'search_products');
                });
                if (!$(this).hasClass('prdctfltr_mobile')) {
                    var id = $(this).attr('data-id');
                    if (typeof prdctfltr.pagefilters[id] === 'undefined') {
                        var done = false;
                        $.each(prdctfltr.pagefilters, function(i, e) {
                            if (!done) {
                                if (typeof e.wcsc !== 'undefined') {
                                    prdctfltr.pagefilters[id] = e;
                                    done = true;
                                }
                                if (typeof e.wc !== 'undefined' && typeof e.query_vars.show_products !== 'undefined' && e.query_vars.show_products === 'yes') {
                                    prdctfltr.pagefilters[id] = e;
                                    done = true;
                                }
                            }
                        });
                    }
                }
            });
        }
    }
    check_shortcode_search();

    var infiniteLoad = $('.prdctfltr-pagination-infinite-load');

    function fixScroll() {
        didScroll = true;
    }

    function scrollHandler() {

        if (infiniteLoad.find('a.disabled').length == 0 && $(window).scrollTop() >= infiniteLoad.position().top - $(window).height() * 0.8) {
            infiniteLoad.find('a:not(.disabled)').trigger('click');
        }

    };

    if (infiniteLoad.length > 0) {

        $(window).on({
            'scroll': fixScroll
        });

        var didScroll = false;

        var scrollInterval = setInterval(function() {
            if (didScroll) {
                didScroll = false;
                if (ajaxActive !== false || historyActive !== false) {
                    return false;
                }
                scrollHandler();
            }
        }, 250);

    }

    function scrollTo(to) {
        to = to > -1 ? to - 130 : 0;

        var start = $(window).scrollTop(),
            duration = parseInt((Math.abs(to - start) + 1000) / 7.5, 10),
            change = to - start,
            currentTime = 0,
            increment = 20;

        var animateScroll = function() {
            currentTime += increment;
            var val = Math.easeInOutQuad(currentTime, start, change, duration);
            window.scrollTo(0, val);

            if (currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };
        
        animateScroll();
    }

    Math.easeInOutQuad = function(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    function prdctfltr_added_check(curr) {

        curr = (curr == null ? $('.prdctfltr_wc:visible') : curr);

        curr.each(function() {
            var adds = {};
            var obj = $(this);

            obj.find('.prdctfltr_attributes').each(function() {

                var attribute = $(this);
                var valOf = attribute.find('input[type="hidden"]:first');
                var makeVal = valOf.val();

                if (typeof makeVal !== 'undefined' && makeVal !== '') {

                    var vals = [];

                    if (makeVal.indexOf(',') > 0) {
                        vals = makeVal.split(',');
                    } else if (makeVal.indexOf('+') > 0) {
                        vals = makeVal.split('+');
                    } else {
                        vals[0] = makeVal;
                    }

                    var filter = $(this);

                    var lenght = vals.length;

                    $.each(vals, function(i, val23) {

                        if (curr.find('.prdctfltr_filter[data-filter="' + valOf.attr('name') + '"] input[type="checkbox"][value="' + val23 + '"]').length == 0) {

                            var dataFilter = filter.attr('data-filter');

                            if (typeof adds[dataFilter] === 'undefined') {
                                adds[dataFilter] = [];
                            }
                            if ($.inArray(val23, adds[dataFilter]) == -1) {
                                adds[dataFilter].push(val23);
                                valOf.val('');
                            }
                            obj.each(function() {
                                var wrap = $(this);
                                wrap.find('.prdctfltr_add_inputs').append('<input name="' + dataFilter + '" value="' + makeVal + '" class="pf_added_input" />');
                            });
                        }

                    });
                }

            });
        });
    }
    prdctfltr_added_check();

    prdctfltr.goRespond = function() {
        if (ajaxActive === true) {
            return false;
        }

        prdctfltr_respond_550($('.prdctfltr_wc:first form'));
    }

    jQuery.fn.outerHTML = function(s) {
        return s ?
            this.before(s).remove() :
            jQuery("<p>").append(this.eq(0).clone()).html();
    };

    function __do_adoptive_search_term(o,d,m) {
        if ( m ) {
            o.addClass('pf_adoptive_hide');
            if ( d === 'unclick' || d === 'default' ) {
                o.attr('disabled', true);
            }
        }
    }
    function __do_adoptive_select_term(o,d,m) {
        if ( m ) {
            o.addClass('pf_adoptive_hide');
            if ( d === 'unclick' ) {
                o.attr('disabled', true);
            }
        }
    }

    function __get_adoptive(e) {
        var c = e.closest('.prdctfltr_filter');
        if ( c.length>0 ) {
            if ( c.hasClass('pf_adptv_unclick') ) {
                return 'unclick';
            }

            if ( c.hasClass('pf_adptv_default') ) {
                return 'default';
            }

            if ( c.hasClass('pf_adptv_click') ) {
                return 'click';
            }
        }
        return false;
    }

    function _fix_system_selects(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.find('.prdctfltr_terms_customized_system').each(function() {
            var t = $(this);
            var s = $('<select/>').addClass('pf-system-select');
            var d = __get_adoptive($(this));

            t.find('.prdctfltr_checkboxes label').each(function() {
                var p = $(this).parents('.prdctfltr_sub').length;

                var o = $('<option>').attr('value', $(this).find('input[type="checkbox"]:first').val()).text((p>0?'-'.repeat(p)+' ':'')+$(this).text());

                s.append(o);

                if ( d !== false ) {
                    __do_adoptive_select_term(o,d,$(this).hasClass('pf_adoptive_hide'));
                }
            });

            t.find('.prdctfltr_checkboxes label.prdctfltr_active').each(function() {
                s.find('option[value="' + $(this).find('input[type="checkbox"]:first').val() + '"]').attr('selected', true).addClass('pf-selected').prepend('✓ ');
            });

            t.find('.prdctfltr_add_scroll').prepend(s);
        });
    }
    _fix_system_selects();

    $(document).on('change', '.pf-system-select', function() {
        if ($(this).val() === null || $(this).val() === '') {
            $(this).find('.pf-selected').each(function() {
                $(this).removeClass('pf-selected').text($(this).text().replace('✓ ', ''));
            });

            $(this).parent().find('.prdctfltr_checkboxes label.prdctfltr_active').each(function() {
                $(this).trigger('click');
            });
        } else {
            var o = $(this).find('option[value="' + $(this).val() + '"]');

            if (o.hasClass('pf-selected')) {
                o.removeClass('pf-selected').text(o.text().replace('✓ ', ''));
            } else {
                o.addClass('pf-selected').prepend('✓ ');
            }

            $(this).parent().find('input[value="' + $(this).val() + '"]').parent().trigger('click');
        }
    });


    function _fix_search_selects(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.find('.prdctfltr_terms_customized_selectize').each(function() {
            var t = $(this);
            var s = $('<select/>').addClass('pf-search-select');
            var d = __get_adoptive($(this));

            if ($(this).hasClass('prdctfltr_multi')) {
                s.attr('multiple', true);
            }

            t.find('.prdctfltr_checkboxes label').each(function() {
                var p = $(this).parents('.prdctfltr_sub').length;

                var o = $('<option>').attr('value', $(this).find('input[type="checkbox"]:first').val()).text((p>0?'-'.repeat(p)+' ':'')+$(this).text());
              
                s.append(o);

                if ( d !== false ) {
                    __do_adoptive_search_term(o,d,$(this).hasClass('pf_adoptive_hide'));
                }
            });

            t.find('.prdctfltr_checkboxes label.prdctfltr_active').each(function() {
                s.find('option[value="' + $(this).find('input[type="checkbox"]:first').val() + '"]').attr('selected', true);
            });

            t.find('.prdctfltr_add_scroll').prepend(s);
        });

        curr.find('.prdctfltr_terms_customized_selectize select').each(function() {
            var s = $(this);
            var sf = $(this).closest('.prdctfltr_filter');

            s.selectize({
                plugins: s.prop('multiple')?['remove_button']:[],
                delimiter: ',',
            
                onChange: function(i) {
                    if ( i === '' || i === null ) {
                        sf.find('label.prdctfltr_active').trigger('click');
                    }
                    else {
                        if ( typeof i === 'string' ) {
                            i = [i];
                        }

                        $.each( i, function(b,c) {
                            sf.find('label:not(.prdctfltr_active) input[value="' + c + '"]').parent().trigger('click');
                        } );
                        
                        $.each( sf.find('label.prdctfltr_active input[type="checkbox"]'), function() {
                            if ( i.indexOf($(this).val()) == -1 ) {
                                $(this).parent().trigger('click');
                            }
                        } );
                    }
                }
            });
        });

    }
    _fix_search_selects();

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    function reorder_limit(curr) {
        curr = (typeof curr === 'undefined' ? $('.prdctfltr_wc') : curr);

        curr.each(function() {
            $(this).find('.prdctfltr_attributes, .prdctfltr_meta').each(function() {
                var max = parseInt($(this).attr('data-limit'), 10);

                if (max < 1) {
                    return false;
                }
                
                var searchIn = $(this).hasClass('pf_adptv_default') ? 'label:not(.pf_adoptive_hide)' : 'label';

                $(this).find('.prdctfltr_checkboxes').each(function() {
                    if ($(this).find(searchIn).length > max) {
                        $(this).find(searchIn).slice(max).attr('style', 'display:none !important')
                        $(this).append($('<div class="pf_more"><span>' + prdctfltr.localization.show_more + '</span></div>'));
                    }
                });
            });
        });
    }
    reorder_limit();

    function product_filter_accessibility(curr) {
        curr = (typeof curr === 'undefined' ? $('.prdctfltr_wc') : curr);

        curr.each(function() {
            $(this).find('.prdctfltr_checkboxes input[type="checkbox"]').keypress(function (e) {
                var key = e.which;

                if(key == 13) {
                    $(this).parent().trigger('click');
                }
            });

            $(this).find('prdctfltr_title_remove').attr('tabindex', '0');
        });

    }
    product_filter_accessibility();

    function active_filtering() {
        if ( u(prdctfltr.active_filtering) ) {
            if ( u(prdctfltr.active_filtering.active) ) {
                _sort_active_filters();
            }

            if ( u(prdctfltr.active_filtering.variable) === false ) {
                return false;
            }

            ACVariables();
            ACVariable();
            ACVariableAddOutOfStock();

            /*if ( u(prdctfltr.instock) ) {
                ACVariableRecount();
                ACVariableRecountAddReduced();
            }*/
        }
    }
    active_filtering();

    function ACVariables() {
        prdctfltr.active_filtering.reduce_counters = {};
        prdctfltr.active_filtering.inactive_parents = [];
    }

    function ACVariableAddOutOfStock() {
        if ( prdctfltr.active_filtering.inactive_parents.length > 0 ) {
            var pre = prdctfltr.ajax_product_class+".instock.post-";
            $(pre+prdctfltr.active_filtering.inactive_parents.join(", "+pre)).removeClass('instock').addClass('out-of-stock').find('a img.attachment-woocommerce_thumbnail').before('<span class="xwc--pf-outofstock">'+prdctfltr.localization.outofstock+'</span>');
        }
    }

    function ACVariableVariationTurnBlue(p,t) {
        prdctfltr.active_filtering.inactive_parents.push(p);
    }

    function ACVariableVariationAttributeIsSelected(a,t) {
        if ( prdctfltr.active_filtering.active[a.substring(10)] == "" ) {
            return true;
        }

        if ( prdctfltr.active_filtering.active[a.substring(10)] == t ) {
            return true;
        }

        return false;
    }

    function ACVariableVariationAttributeSingle(v) {
        for (var k in v) {
            if ( ACVariableVariationAttributeIsSelected( k, v[k] ) ) {
                return true;
            }
        }

        return false;
    }

    function ACVariableVariationAttributeMultiple(v,c) {
        var s = 0;

        for (var k in v) {
            if ( ACVariableVariationAttributeIsSelected( k, v[k] ) ) {
                s++;
            }
        }

        return s==c?true:false;
    }

    function ACVariableVariationAttribute(v) {
        var vCount = Object.keys(v).length;

        if ( vCount<2 ) {
            return ACVariableVariationAttributeSingle(v);
        } else {
            return ACVariableVariationAttributeMultiple(v,vCount);
        }
    }

    function ACVariableVariation(c) {
        var product = $(prdctfltr.ajax_product_class+'.instock.post-'+c._id);

        if ( product.length>0 ) {
            var cLength = c._v.length;

            for(var b=0;b<cLength;b++) {
                if ( c._v[b][1] === false ) {
                    if ( ACVariableVariationAttribute(c._v[b][0]) ) {
                        ACVariableVariationTurnBlue(c._id,c._v[b][2]);
                        continue;
                    }
                }
            }
        }
    }

    function ACVariableAddBadges() {
        $(prdctfltr.ajax_product_class+'.out-of-stock a img.attachment-woocommerce_thumbnail').before('<span class="xwc--pf-outofstock">'+prdctfltr.localization.outofstock+'</span>');
    }
    
    function ACVariable() {
        var v = prdctfltr.active_filtering.variable;
        var vLength = v.length;

        for(var b=0;b<vLength;b++) {
            ACVariableVariation(v[b]);
        }
    }


    function ACVariableRecountAddReducedIntegers(k, t) {
        var kShort = k.substring(10);
        for (var s in t) {
            var n = parseInt($('.prdctfltr_filter[data-filter="'+kShort+'"] .prdctfltr_ft_'+s+':not(.prdctfltr_active) .pf-recount').html(),10)-t[s];
            $('.prdctfltr_filter[data-filter="'+kShort+'"] .prdctfltr_ft_'+s+':not(.prdctfltr_active) .pf-recount').text(n);
        }
    }

    function ACVariableRecountAddReduced() {
        for (var k in prdctfltr.active_filtering.reduce_counters) {
            ACVariableRecountAddReducedIntegers(k, prdctfltr.active_filtering.reduce_counters[k]);
        }
    }

    function ACVariableRecountReduceTerms(t) {
        for (var k in t) {
            if ( u(prdctfltr.active_filtering.reduce_counters[k]) === false ) {
                prdctfltr.active_filtering.reduce_counters[k] = {};
            }

            if ( u(prdctfltr.active_filtering.reduce_counters[k][t[k]]) === false ) {
                prdctfltr.active_filtering.reduce_counters[k][t[k]] = 0;
            }
            prdctfltr.active_filtering.reduce_counters[k][t[k]]++;
        }
    }

    function ACVariableRecountReduce(c) {
        var cLength = c._v.length;

        for(var b=0;b<cLength;b++) {
            if ( c._v[b][1] === false ) {
                ACVariableRecountReduceTerms(c._v[b][0]);
            }
        }
    }

    function ACVariableRecount() {
        var v = prdctfltr.active_filtering.variable;
        var vLength = v.length;

        for(var b=0;b<vLength;b++) {
            ACVariableRecountReduce(v[b]);
        }
    }

    function _sort_active_filters() {
        var v = prdctfltr.active_filtering.active;

        prdctfltr.instock = u(v.instock_products);

        prdctfltr.active_filtering.attributes = [];

        for (var k in v) {
            if (!v.hasOwnProperty(k)) continue;
            if (k.substring(0,3) !== 'pa_') continue;

            prdctfltr.active_filtering.attributes.push({'_a':k, '_t':v[k]});
        }
    }
    
    function __check_masonry(curr) {
        curr = (curr == null ? $('.prdctfltr_wc') : curr);

        curr.each( function() {
            if ( $(this).hasClass('pf_mod_masonry')) {
                var d = $(this).find('.prdctfltr_filter_inner');

                if (d.data('isotope')) {
                    d.isotope('layout');
                } else {
                    d.isotope( {
                        resizable: false,
                        masonry: {}
                    } );
                }

                setTimeout( function(e) {
                    e[0].isotope('layout', {transformsEnabled: false});
                }, 0, [d] );
            }
        } );
    }
    __check_masonry();

    $('body').append('<div class="prdctfltr_overlay"></div>');

})(jQuery);

