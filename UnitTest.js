class UnitTest {
    /**
     * @param {string} [name='UnitTest']
     * @param {Object} [params={}]
     * @param {function} [params.logCallback=console.log]
     * @param {function} [params.logPattern=UnitTest.LOGPATTERNS.DEFAULT]
     */
    constructor (name = 'UnitTest', params = {}) {
        params = typeof params === 'object'
            ? {...UnitTest.DEFAULTPARAMS, ...params}
            : {...UnitTest.DEFAULTPARAMS};
        this.logCallback = params.logCallback;
        this.logPattern = params.logPattern;
        this.name = name;
        this._assertions = []
    }
    async prepare(params = {}) {
        return true;
    }
    async run (params = {}) {
        await this.prepare(params);
        await this.test(params);
        return this;
    }
    async test(params = {}) {
        return true;
    }
    async assert(test, description='assert', successOn=true) {
        let success;
        if (typeof successOn === 'function') {
            success = await successOn(test);
        }
        else
            success = successOn === test
        this._assertions.push({value: test, success: success, description:description||'assert'})
        return this;
    }

    evaluate() {
        let output = {name: this.name, fail: [], success: []};
        this._assertions.forEach(assertion => {
            if (assertion.success)
                output.success.push(assertion);
            else
                output.fail.push(assertion);
        });
        return output;
    }
    log(cb = this.logCallback, mode=this.logPattern){
        let evaluated = this.evaluate();
        let output = (typeof mode === 'function') ? mode(evaluated) : evaluated;
        cb(output);
        return output;
    }
}
UnitTest.LOGPATTERNS = {
    ASCII: (evaluated) => {
        
        let output = '';
        const ULC = '┌';
        const HL = '─';
        const URC = '┐';
        const UT = '┬';
        const VL = '│';
        const CRS = '┼';
        const LT = '├';
        const RT = '┤';
        const BLC = '└';
        const BT = '┴';
        const BRC = '┘'
        const WS = ' ';
        const SUCCESS = '✓';
        //const FAIL = '⚠';
        const FAIL = " ";
        const NL = "\n"+WS.repeat(4);
        const maxLength = 150;
        const evalColumnLength = 5;

        output += NL;
        let line = ULC + HL.repeat(maxLength-2) + URC;
        output += line + NL;
        line = VL + WS + evaluated.name.substr(0, maxLength-(2+2));
        line += WS.repeat(maxLength - line.length -1) + VL;
        output +=line+ NL;
/*        line = LT + HL.repeat(maxLength-2) + RT;
        output +=line+ NL;
        line = VL + WS + 'FAILS (' + evaluated.fail.length + '/'+LEN_ALL+')';
        line += WS.repeat(maxLength-1-line.length) + VL;

        output +=line+ NL;
 */
        line = LT + HL.repeat(3) + UT + HL.repeat(maxLength-1-evalColumnLength) + RT;
        output +=line+ NL;
        const ALL = [...evaluated.fail, ...evaluated.success];
        ALL.forEach( (test, index) => {

            line = VL + WS+ (test.success ? SUCCESS : FAIL) + WS + VL  + WS;
            line += test.description.substr(0, maxLength-line.length - evalColumnLength-2);
            line += WS.repeat(maxLength-line.length-1) + VL;
            output +=line+ NL;
            if (index === ALL.length-1) {
                line = LT + HL.repeat(3) + BT;
                line += HL.repeat(Math.ceil(maxLength/3)-line.length-1) + UT;
                line += HL.repeat(Math.ceil((maxLength/3)*2)-line.length-1) + UT
                line += HL.repeat(maxLength-line.length-1) + RT

            }
            else {
                line = LT + HL.repeat(3) + CRS + HL.repeat(maxLength-1-evalColumnLength) + RT;
            }
            output +=line+ NL;
        });
        line = VL + WS + "FAILS: " + evaluated.fail.length;
        line += WS.repeat(Math.ceil(maxLength/3)-line.length-1) + VL + ' SUCCESS: ' + evaluated.success.length;
        line += WS.repeat(Math.ceil((maxLength/3)*2)-line.length-1) + VL + ' TESTS: ' + ALL.length;
        line += WS.repeat(maxLength-line.length-1) + VL;
        output +=line+ NL;
        line = BLC;
        line += HL.repeat(Math.ceil(maxLength/3)-line.length-1) + BT;
        line += HL.repeat(Math.ceil((maxLength/3)*2)-line.length-1) + BT
        line += HL.repeat(maxLength-line.length-1) + BRC
        output +=line+ NL;

        return output;
    }
}
UnitTest.LOGPATTERNS.DEFAULT = UnitTest.LOGPATTERNS.ASCII;
UnitTest.DEFAULTPARAMS = {
    logCallback: console.log,
    logPattern: UnitTest.LOGPATTERNS.DEFAULT
};



class UnitTestCollection {
    constructor (params = {}) {
        params = Object.assign({
            tests: [],
            logCallback: console.log,
                logPattern: UnitTest.LOGPATTERNS.DEFAULT,
            name: 'unnamed UnitTestCollection'

        }, params);
        /**
         * @type {[]}
         */
        this.tests = params.tests;
        this.logCallback = params.logCallback;
        this.logPattern = params.logPattern;
        this.name = params.name;
    }

    /**
     *
     * @return {UnitTestCollection}
     * @param tests
     * @param index
     */
    add(...tests){
        let index = tests.pop();
        if (typeof index !== 'number') {
            tests = [...tests, index];
            index = this.tests.length;
        }
        this.tests.splice(index, 0, ...tests);
        return this;
    }
    remove(...indices) {
        indices.forEach(index => this.tests.splice(index, 1))
        return this;
    }
    async prepare(params) {
        return this;
    }
    async prepareChilds(params) {
        let prepares = [];
        this.tests.forEach(test => prepares.push(test.prepare()));
        await Promise.all(prepares);
        return this;
    }
    async _runAll(params) {
        let runners = [];
        this.tests.forEach(test => runners.push(test.run(params)));
        await Promise.all(runners);
        return this;
    }
    async run(params) {
        await this.prepare(params);
        await this.prepareChilds(params);
        await  this._runAll(params);
        return this;
    }
    log(params ={}){
        params = (typeof params === 'object') ?
            {...UnitTestCollection.DEFAULTPARAMS, ...params}
            : {...UnitTestCollection.DEFAULTPARAMS};
        if (params.callback_self === null)
            params.callback_self = this.logCallback;
        let output = "\n"+this.name+ ' ('+new Date()+")";
        this.tests.forEach(test => {
            if (typeof params.callback_children === 'function')
                output += test.log(params.callback_children);
            else
                output += test.log();
        })

        if (typeof params.callback_self === 'function')
            params.callback_self(output);
        return output;
    }
}
const _echo = x=>x;
UnitTestCollection.DEFAULTPARAMS = {
    callback_children: _echo,
    callback_self: null
};
export {UnitTest, UnitTestCollection}