import fs from 'fs';

import path from 'path';
import capture from './helpers/capture.mjs'

/* 
    This test renders a predefined set of content stored in ./dev-helpers and checks if the result equals a previously generated 'golden' one.
    If you make changes to the code, this test is likely to fail.
    You can update the golden version of generated files with 'npm run updateGoldenSnapshot'.
    Please verify that all changes to the resulting ./tests/golden-snapshot are intended!
*/
describe('All golden test websites', () => {

    it('should be unchanged when rendered with current logic', async () => {
        const currentPages = await capture.capturePages('./tests/helpers/capture_config.json');

        for (const page of currentPages) {
            const pageName = page.page;
            const goldenPage = fs.readFileSync(path.join( './tests/golden_snapshot', pageName), 'utf8')
            expect(page.output).toBe(goldenPage);
        }
    }, 60000);
});
