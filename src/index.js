const {
    window,
    Position,
    Range,
    workspace
} = require('vscode');

const beautify = require('js-beautify');
const pugBeautify = require('pug-beautify');

const {
    breakTagAttr
} = require('./plugins');

let defaultConf = require('./js-beautify.conf');
let editor;

let methods = {
    doc: null,
    text: '',
    newText: '',
    lineCount: 1,
    jsBeautifyConf: defaultConf['js-beautify'],
    pugBeautifyConf: defaultConf['pug-beautify'],
    editorConf: {},
    init() {
      
        editor = window.activeTextEditor;
        if (!editor) throw new Error('no active editor');
       
        this.doc = editor.document;
    
        this.getConfig();

    
        this.lineCount = this.doc.lineCount;
       
        this.text = this.doc.getText();
        
        this.newText = '';
       
        this.splitContent(this.text);
       
        this.writeFile();
    },
    splitContent(text) {
        let formatNeed = this.svelteFormatConf.format_need || ['html', 'js', 'css'];

        
        let jsText = text.match(/<script[\w\W]+<\/script>\s?/);
        let cssText = text.match(/<style[\w\W]+<\/style>\s?/);

        console.log(jsText)

        let htmlText = text;
        
        if(jsText != null){
            jsText.forEach(item => {
            
                htmlText = htmlText.replace(item,'');
                
            });
        }

        if(cssText != null){

            cssText.forEach(item => {
                htmlText = htmlText.replace(item,'');
            });
        }

        if (htmlText && formatNeed.includes('html')) {
            text = text.replace(htmlText,this.beautyHtml(htmlText));

        }
        if (jsText && formatNeed.includes('js')) {
            let jsArr = jsText[0].split(/<\/script>\n*/);
            jsArr.forEach((item, index) => {
                let pre = '';
                if (index === 0) {
                    pre = '\n';
                }
                let str = item + '</script>';


                text = item ? text.replace(str, () => pre + this.beautyJs(str)) : text;
            });
            
        }
        if (cssText && formatNeed.includes('css')) {
            let cssArr = cssText[0].split(/<\/style>\n*/);
            cssArr.forEach((item, index) => {
                let pre = '';
                if (index === 0) {
                    pre = '\n';
                }
                let str = item + '</style>';
                text = item ? text.replace(str, () => pre + this.beautyCss(str)) : text;
            });
        }
        this.newText = text.replace(/(\n|\t|\r)\s*(\n|\t|\r){2,}/g, '$1$1').trim() + '\n';
    },
    mergeFormatTag(arrUnFormat = [], arrForceFormat = []) {
        arrForceFormat.forEach(item => {
            let index = arrUnFormat.indexOf(item);
            if (index > -1) {
                arrUnFormat.splice(index, 1);
            }
        });
        return arrUnFormat;
    },
    beautyHtml(text) {
        let str = '';

        let lang = this.getLang(text);

     
        if (/pug/.test(lang)) {
            str = pugBeautify(text, this.pugBeautifyConf)
                .trim();
        } else {
            let tempConf = Object.assign(this.jsBeautifyConf, this.jsBeautifyConf.html);
            str = beautify.html(text, tempConf);
            if (tempConf.wrap_attributes == 'auto' && +this.svelteFormatConf.break_attr_limit > -1) {
                str = breakTagAttr(str, +this.svelteFormatConf.break_attr_limit, {
                    indentSize: +this.jsBeautifyConf.indent_size,
                    attrEndWithGt: this.svelteFormatConf.attr_end_with_gt,
                    tempConf: tempConf
                });
            }
        }

        return `${str}\n`;
    },
    beautyCss(text) {
        let scoped = /<style[^>]*\s+scoped/.test(text) ? ' scoped' : '';
        let lang = this.getLang(text);
        let str = text;
        text = text.replace(/<style[^>]*>([\w\W]*)<\/style>/, '$1');
        if (text.trim()) {
            let tempConf = Object.assign({}, this.jsBeautifyConf, this.jsBeautifyConf.css);
            str = beautify.css(text, tempConf);
            return `<style${lang}${scoped}>\n${str}\n</style>`;
        } else {
            return str;
        }
    },
    beautyJs(text) {
        let scoped = /<script[^>]*\s+scoped/.test(text) ? ' scoped' : '';
        let lang = this.getLang(text);
        let str = text;
        text = text.replace(/<script[^>]*>([\w\W]*)<\/script>/, '$1');

     
        if (text.trim()) {
            let tempConf = Object.assign({}, this.jsBeautifyConf, this.jsBeautifyConf.js);
            str = beautify.js(text, tempConf);

            return `<script${lang}${scoped}>\n${str}\n</script>`;
        } else {
            return str;
        }
    },
    getLang(text) {
        let lang = text.match(/lang=(["'])([a-zA-Z\-\_]*)\1/, '$2');
        return lang && ` lang="${lang.pop()}"` || '';
    },
    writeFile() {
        let start = new Position(0, 0);
        let end = new Position(this.lineCount + 1, 0);
        let range = new Range(start, end);
        editor.edit((editBuilder, error) => {
            error && window.showErrorMessage(error);
            editBuilder.replace(range, this.newText);
        });
    },
    getConfig() {

        this.editorConf = Object.assign({}, workspace.getConfiguration('editor'));
        this.initDefaultJsBConf(this.jsBeautifyConf);
        let svelteFormatConf = workspace.getConfiguration('svelte-format');
        this.svelteFormatConf = svelteFormatConf;
        if (!svelteFormatConf) {
            return;
        }
        let jsBConf = svelteFormatConf.get('js-beautify') || {};
        this.mergeBeautifyConf(jsBConf, 'jsBeautifyConf');
        let pugBConf = svelteFormatConf.get('pug-beautify') || {};
        this.mergeBeautifyConf(pugBConf, 'pugBeautifyConf');
    },
    initDefaultJsBConf(conf) {
        this.jsBeautifyConf.indent_size = this.editorConf.tabSize;
        if (this.editorConf.insertSpaces) {
            this.jsBeautifyConf.indent_char = ' ';
        } else {
            this.indent_with_tabs = true;
        }
    },
    mergeBeautifyConf(conf, type) {
        for (let k in conf) {
            // if (!this[type][k]) {
            //     continue;
            // }
            let cont = conf[k];
            if (typeof cont === 'string') {
                let teMatch = cont.match(/editor\.(\w+)/g);
                if (teMatch) {
                    let editKey = teMatch[0].replace('editor.', '');
                    cont = this.editorConf[editKey];
                }
            }
            if (cont instanceof Object) {
                Object.assign(this[type][k], cont);
            } else {
                this[type][k] = cont;
            }
        }
        return this[type];
    }
};

module.exports = methods;