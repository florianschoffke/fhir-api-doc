import utils from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
    hashLinkHighlight();
    addDataAnchorToRequirementLink();
});

function addDataAnchorToRequirementLink() {
    document.querySelectorAll(".requirement-link").forEach(function (link) {
        let anchor = link.getAttribute("data-anchor");
        if (anchor && link.href) {
            link.href = link.href + "#" + anchor;
        }
    });
}

function removeActorTags(xmlString) {
    xmlString = xmlString.replace(/<actor\b[^>]*>[\s\S]*?<\/actor>/gi, '');
    xmlString = xmlString.replace(/<actor\b[^>]*\/>/gi, '');
    return xmlString;
}

function removeMetaTags(xmlString) {
    xmlString = xmlString.replace(/<meta\b[^>]*>[\s\S]*?<\/meta>/gi, '');
    xmlString = xmlString.replace(/<meta\b[^>]*\/?>/gi, '');
    return xmlString;
}

function cleanRequirementDescription(desc) {
    desc = removeActorTags(desc);
    desc = removeMetaTags(desc);
    return desc;
}

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');

    requirements.forEach(req => {

        const reqKey = req.getAttribute('key') || '';
        const reqVersion = parseFloat(req.getAttribute('version')) || 0;

        // version starts with (1 -> "01", 9 -> "09", 10 -> "10")
        const formattedVersion = reqVersion > 0 
            ? String(reqVersion).padStart(2, '0') 
            : '';

        const combinedReqKey = reqKey && reqVersion > 0
            ? `${reqKey}-${formattedVersion}` 
            : reqKey;

        // actor with attribute version for backwards compatibility
        let actorText = req.getAttribute('actor') || '';
        const actors = req.querySelectorAll('actor') || [];
        if (actors.length > 0) {
            actorText = Array.from(actors)
                .map(actor => {
                    const name = actor.getAttribute('name');
                    return name;
                }).filter(Boolean).join(', ');
        }

        const titleText = req.getAttribute('title') || '';
        const conformanceText = utils.translateExpectation(req.getAttribute('conformance') || '');

        const descriptionHTML = cleanRequirementDescription(req.innerHTML.trim());

        const reqDiv = document.createElement('div');
        reqDiv.classList.add('requirement');
        if(combinedReqKey) {
            reqDiv.id = combinedReqKey;
        }
        const headingParts = [
            combinedReqKey, 
            titleText,
            conformanceText
        ].filter(Boolean);

        if (headingParts.length > 0) {
            const heading = document.createElement('p');
            heading.classList.add('heading');
            heading.textContent = headingParts.join(' - ');
            reqDiv.appendChild(heading);
            if(combinedReqKey) {
                const anchor = document.createElement('a');
                anchor.href = `#${combinedReqKey}`;
                anchor.className = 'anchorjs-link';
                anchor.setAttribute('aria-label', 'Anchor');
                anchor.setAttribute('data-anchorjs-icon', '');
                anchor.style.font = '1em / 1 anchorjs-icons';
                anchor.style.paddingLeft = '0.375em';
                heading.appendChild(anchor);
            }
        }

        if (descriptionHTML) {
            const descP = document.createElement('p');
            descP.innerHTML = `${descriptionHTML} <span class="gem-req-workitem-fields-end-inner"><span class="gem-req-actor">${actorText}</span> [<=]</span>`;
            reqDiv.appendChild(descP);
        }

        req.parentElement.replaceChild(reqDiv, req);
    });
}

function hashLinkHighlightTarget(targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.classList.add('requirement-highlight');
        setTimeout(() => {
            targetElement.classList.remove('requirement-highlight');
        }, 2000);
    }
}

function hashLinkHighlight() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        hashLinkHighlightTarget(hash);
    }

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            hashLinkHighlightTarget(hash);
        }
    });
}

export default {
    addDataAnchorToRequirementLink,
    removeActorTags,
    removeMetaTags,
    cleanRequirementDescription,
    renderRequirements,
    hashLinkHighlightTarget,
    hashLinkHighlight
};
