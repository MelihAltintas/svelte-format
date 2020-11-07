function breakTagAttr(str = '', breakLimitNum = 1, opt = {
    indentSize: 4,
    attrEndWithGt: true,
    tempConf: {}
}) {
    if (breakLimitNum === -1) {
        return str;
    }
    let {
        indentSize,
        attrEndWithGt,
        tempConf
    } = opt;
    let {
        unBreakAttrList
    } = tempConf;
    let padIndent = ' '.repeat(indentSize);
    const TAG_REG = /[\n\r\t]*(\s*)\<[A-z\-\_0-9]+/;
    const TAG_END_REG = /\s*(>|\/>)/;
    const TAG_NAME_REG = /\<([A-z][\w\-]*)/;

    const ATTR_REG = /(\s(\:|\@)?[A-z0-9\-\_\.\:]+(=("[^"]*"|'[^']+'|`[^`]+`|[A-z0-9\_]+))?)/g;
    const TAG_ATTR_REG = new RegExp(TAG_REG.source + ATTR_REG.source + '+' + TAG_END_REG.source, 'g');
    const TAG_CLOSE_REG = new RegExp(TAG_END_REG.source + '$');

    let loop = true;
    while (loop) {
        
        let res = TAG_ATTR_REG.exec(str);
        if (res) {
           
            let indent = res[1];
        
            let tagContent = res[0];
            let tagName = tagContent.match(TAG_NAME_REG);
            if (unBreakAttrList.includes(tagName[1])) {
                continue;
            }

            let matchRes = tagContent.match(ATTR_REG);

            if (matchRes.length > breakLimitNum) { 
          
                let newStr = tagContent.replace(ATTR_REG, (match, $1) => {
                    return '\n' + indent + padIndent + $1.trim();
                });
               
                newStr = attrEndWithGt ? newStr : newStr.replace(TAG_CLOSE_REG, '\n' + indent + '$1');
          
                str = str.replace(tagContent, newStr);
            }
        } else {
            loop = false;
        }
    }
    return str;
}

module.exports = {
    breakTagAttr
};