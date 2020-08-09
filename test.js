import {UnitTest, UnitTestCollection} from './UnitTest.js';

import fs from 'fs';

const unitTestTest = new UnitTest('UnitTestTest');
unitTestTest.test = async function(params) {
    await this.assert(this.name === 'UnitTestTest', 'name is set correctly');
    return true;
};
const numbersTest = new UnitTest('NumbersTest');
numbersTest.test = async function(params) {
    await this.assert(22<10, "22 < 10");
    await this.assert(10-5, "10 - 5 (expected 5)", 5);
    await this.assert(1, "test with asserted function", (x) => x===1);
    return true;
};
const saveLog = (output) => {
    fs.writeFileSync('LOG.txt', output);
    console.log(output);
}

const unitTestCollection = new UnitTestCollection({logCallback: saveLog});
unitTestCollection.add(unitTestTest, numbersTest);



unitTestCollection.run()
    .then(coll =>
    coll.log()
    )
    .catch(e => console.error("Error in TestCollection:", e))
