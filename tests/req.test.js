jest.mock('../src/utils.js', () => {
    return {
        __esModule: true,
        default: {
            translateExpectation: jest.fn((value) => value ? `Translated: ${value}` : '')
        }
    };
});

import req from '../src/req.js';

describe('addDataAnchorToRequirementLink', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should add anchor to link href when data-anchor exists', () => {
        document.body.innerHTML = `
      <a class="requirement-link" href="https://example.com/page" data-anchor="section1"></a>
    `;
    
        req.addDataAnchorToRequirementLink();
    
        const link = document.querySelector('.requirement-link');
        expect(link.href).toBe('https://example.com/page#section1');
    });

    test('should not modify href when data-anchor is missing', () => {
        document.body.innerHTML = `
      <a class="requirement-link" href="/page"></a>
    `;
    
        const originalHref = document.querySelector('.requirement-link').href;
        req.addDataAnchorToRequirementLink();
    
        const link = document.querySelector('.requirement-link');
        expect(link.href).toBe(originalHref);
    });

    test('should handle multiple requirement links', () => {
        document.body.innerHTML = `
      <a class="requirement-link" href="https://example.com/page1" data-anchor="section1"></a>
      <a class="requirement-link" href="https://example.com/page2" data-anchor="section2"></a>
      <a class="requirement-link" href="https://example.com/page3"></a>
    `;
    
        req.addDataAnchorToRequirementLink();
    
        const links = document.querySelectorAll('.requirement-link');
        expect(links[0].href).toBe('https://example.com/page1#section1');
        expect(links[1].href).toBe('https://example.com/page2#section2');
        expect(links[2].href).toBe('https://example.com/page3');
    });

    test('should handle empty data-anchor', () => {
        document.body.innerHTML = `
      <a class="requirement-link" href="/page" data-anchor=""></a>
    `;
    
        req.addDataAnchorToRequirementLink();
    
        const link = document.querySelector('.requirement-link');
        expect(link.href).not.toContain('#');
    });
});

describe('removeActorTags', () => {
    test('should remove self-closing actor tags', () => {
        const input = 'Some text <actor name="User" /> more text';
        const result = req.removeActorTags(input);
        expect(result).toBe('Some text  more text');
    });

    test('should remove actor tags with content', () => {
        const input = 'Some text <actor name="User">Content</actor> more text';
        const result = req.removeActorTags(input);
        expect(result).toBe('Some text  more text');
    });

    test('should remove multiple actor tags', () => {
        const input = '<actor name="User1" /><actor name="User2">Content</actor>';
        const result = req.removeActorTags(input);
        expect(result).toBe('');
    });

    test('should handle text without actor tags', () => {
        const input = 'Some text without tags';
        const result = req.removeActorTags(input);
        expect(result).toBe('Some text without tags');
    });

    test('should be case insensitive', () => {
        const input = 'Text <ACTOR name="User" /> <Actor>content</Actor>';
        const result = req.removeActorTags(input);
        expect(result).toBe('Text ');
    });
});

describe('removeMetaTags', () => {
    test('should remove self-closing meta tags', () => {
        const input = 'Some text <meta name="test" /> more text';
        const result = req.removeMetaTags(input);
        expect(result).toBe('Some text  more text');
    });

    test('should remove meta tags with content', () => {
        const input = 'Some text <meta name="test">Content</meta> more text';
        const result = req.removeMetaTags(input);
        expect(result).toBe('Some text  more text');
    });

    test('should remove meta tags without self-closing slash', () => {
        const input = 'Some text <meta name="test"> more text';
        const result = req.removeMetaTags(input);
        expect(result).toBe('Some text  more text');
    });

    test('should be case insensitive', () => {
        const input = 'Text <META name="test" /> <Meta>content</Meta>';
        const result = req.removeMetaTags(input);
        expect(result).toBe('Text ');
    });
});

describe('cleanRequirementDescription', () => {
    test('should remove both actor and meta tags', () => {
        const input = 'Text <actor name="User" /> <meta name="test" /> more';
        const result = req.cleanRequirementDescription(input);
        expect(result).toBe('Text   more');
    });
});

describe('renderRequirements', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should render basic requirement with key and version', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1" title="Test Title" conformance="MUST">
        Description text
      </requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        expect(reqDiv).toBeTruthy();
        expect(reqDiv.id).toBe('REQ-01');
    
        const heading = reqDiv.querySelector('.heading');
        expect(heading.textContent).toContain('REQ-01');
        expect(heading.textContent).toContain('Test Title');
        expect(heading.textContent).toContain('Translated: MUST');
    });

    test('should format version with leading zero', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="9">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        expect(reqDiv.id).toBe('REQ-09');
    });

    test('should format version with two digits', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="10">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        expect(reqDiv.id).toBe('REQ-10');
    });

    test('should handle requirement without version', () => {
        document.body.innerHTML = `
      <requirement key="REQ">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        expect(reqDiv.id).toBe('REQ');
    });

    test('should handle requirement without key', () => {
        document.body.innerHTML = `
      <requirement title="Test">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        expect(reqDiv.id).toBe('');
    });

    test('should extract actor from attribute', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1" actor="User">
        Description
      </requirement>
    `;
    
        req.renderRequirements();
    
        const actorSpan = document.querySelector('.gem-req-actor');
        expect(actorSpan.textContent).toBe('User');
    });

    test('should extract actors from child elements', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1">
        Description
        <actor name="User1"></actor>
        <actor name="User2"></actor>
      </requirement>
    `;
    
        req.renderRequirements();
    
        const actorSpan = document.querySelector('.gem-req-actor');
        expect(actorSpan.innerHTML).toBe('User1<br>User2');
    });

    test('should prioritize child actor elements over attribute', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1" actor="AttributeActor">
        Description
        <actor name="ElementActor"></actor>
      </requirement>
    `;
    
        req.renderRequirements();
    
        const actorSpan = document.querySelector('.gem-req-actor');
        expect(actorSpan.textContent).toBe('ElementActor');
    });

    test('should filter out actors without name attribute', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1">
        Description
        <actor name="User1"></actor>
        <actor></actor>
        <actor name="User2"></actor>
      </requirement>
    `;
    
        req.renderRequirements();
    
        const actorSpan = document.querySelector('.gem-req-actor');
        expect(actorSpan.innerHTML).toBe('User1<br>User2');
    });

    test('should render testProcedure values alongside actor names', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1">
        Description
        <actor name="actor1">
            <testProcedure id="testProcedure1"></testProcedure>
            <testProcedure id="testProcedure2"></testProcedure>
        </actor>
        <actor name="actor2">
            <testProcedure id="testProcedure3"></testProcedure>
        </actor>
        <actor name="actor3"></actor>
      </requirement>
    `;

        req.renderRequirements();

        const actorSpan = document.querySelector('.gem-req-actor');
        expect(actorSpan.innerHTML).toBe('actor1: testProcedure1, testProcedure2<br>actor2: testProcedure3<br>actor3');
    });

    test('should add anchor link to heading', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const anchor = document.querySelector('.anchorjs-link');
        expect(anchor).toBeTruthy();
        expect(anchor.getAttribute('href')).toBe('#REQ-01');
        expect(anchor.getAttribute('aria-label')).toBe('Anchor');
    });

    test('should not add anchor if no combined key', () => {
        document.body.innerHTML = `
      <requirement title="Test">Description</requirement>
    `;
    
        req.renderRequirements();
    
        const anchor = document.querySelector('.anchorjs-link');
        expect(anchor).toBeFalsy();
    });

    test('should clean actor and meta tags from description', () => {
        document.body.innerHTML = `
      <requirement key="REQ" version="1">
        Description <actor name="Test" /> text <meta name="test" />
      </requirement>
    `;
    
        req.renderRequirements();
    
        const reqDiv = document.querySelector('.requirement');
        const description = reqDiv.querySelector('p:not(.heading)');
        expect(description.innerHTML).not.toContain('<actor');
        expect(description.innerHTML).not.toContain('<meta');
    });

    test('should handle multiple requirements', () => {
        document.body.innerHTML = `
      <requirement key="REQ1" version="1">Description 1</requirement>
      <requirement key="REQ2" version="2">Description 2</requirement>
    `;
    
        req.renderRequirements();
    
        const reqDivs = document.querySelectorAll('.requirement');
        expect(reqDivs.length).toBe(2);
        expect(reqDivs[0].id).toBe('REQ1-01');
        expect(reqDivs[1].id).toBe('REQ2-02');
    });

    test('should not create heading if all parts are empty', () => {
        document.body.innerHTML = `
      <requirement>Description only</requirement>
    `;
    
        req.renderRequirements();
    
        const heading = document.querySelector('.heading');
        expect(heading).toBeFalsy();
    });
});

describe('hashLinkHighlightTarget', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should highlight target element', () => {
        document.body.innerHTML = `
      <div id="target"></div>
    `;
    
        const element = document.getElementById('target');
        element.scrollIntoView = jest.fn();
    
        req.hashLinkHighlightTarget('target');
    
        expect(element.classList.contains('requirement-highlight')).toBe(true);
        expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('should remove highlight after 2 seconds', () => {
        document.body.innerHTML = `
      <div id="target"></div>
    `;
    
        const element = document.getElementById('target');
        element.scrollIntoView = jest.fn();
    
        req.hashLinkHighlightTarget('target');
    
        expect(element.classList.contains('requirement-highlight')).toBe(true);
    
        jest.advanceTimersByTime(2000);
    
        expect(element.classList.contains('requirement-highlight')).toBe(false);
    });

    test('should do nothing if element not found', () => {
        req.hashLinkHighlightTarget('nonexistent');
        // Should not throw error
        expect(true).toBe(true);
    });
});

describe('hashLinkHighlight', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        window.location.hash = '';
    });

    test('should highlight on page load if hash exists', () => {
        document.body.innerHTML = `
      <div id="section1"></div>
    `;
    
        window.location.hash = '#section1';
        const element = document.getElementById('section1');
        element.scrollIntoView = jest.fn();
    
        req.hashLinkHighlight();
    
        expect(element.scrollIntoView).toHaveBeenCalled();
    });

    test('should not highlight if no hash on page load', () => {
        document.body.innerHTML = `
      <div id="section1"></div>
    `;
    
        window.location.hash = '';
        const element = document.getElementById('section1');
        element.scrollIntoView = jest.fn();
    
        req.hashLinkHighlight();
    
        expect(element.scrollIntoView).not.toHaveBeenCalled();
    });

    test('should add hashchange event listener', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
        req.hashLinkHighlight();
    
        expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    
        addEventListenerSpy.mockRestore();
    });
});
