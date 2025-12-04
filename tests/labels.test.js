import gematikLabels from '../src/labels.js'

// Custom labels are defined in ./setup.js
describe('gematikLabels', () => {

    it('should prefer custom labels', () => {
        expect(gematikLabels.requirements.SHALL).toBe("Custom SHALL label");
        expect(gematikLabels.requirements.SHALL_NOT).toBe("Custom SHALL NOT label");
        expect(gematikLabels.ig.Download_Button_Image).toBe("Custom Bild herunterladen");
        expect(gematikLabels.apiDoc.Copied_Button_Label).toBe("Custom copied button label");
    });

    it('should keep default labels when not overridden', () => {
        expect(gematikLabels.requirements.SHOULD).toBe("SOLL");
        expect(gematikLabels.ig.Download_Button_SVG).toBe("SVG herunterladen");
        expect(gematikLabels.apiDoc.ContentTypes_Label).toBe("Content Types");
    });

    it('should have all three label categories', () => {
        expect(gematikLabels).toHaveProperty('requirements');
        expect(gematikLabels).toHaveProperty('ig');
        expect(gematikLabels).toHaveProperty('apiDoc');
    });
});
