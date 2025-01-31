
window.gematikRequirement = window.gematikRequirement || {
    SHALL: "MUSS",
    SHOULD: "KANN",
    SHOULD_NOT: "DARF NICHT",
    MAY: "OPTIONAL"
};


document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
    hashLinkHighlight();
    addDataAnchorToRequirementLink();
});

function addDataAnchorToRequirementLink() {
    document.querySelectorAll(".requirement-link").forEach(function (link) {
        let anchor = link.getAttribute("data-anchor");
        if (anchor) {
            link.href = link.href + "#" + anchor;
        }
    });
}

function getConformanceText(conformance){
    const translateConformance = (conformance) => ({
        "SHALL": window.gematikRequirement.SHALL,
        'SHOULD': window.gematikRequirement.SHOULD,
        'SHOULD-NOT': window.gematikRequirement.SHOULD_NOT,
        'MAY': window.gematikRequirement.MAY
    }[conformance] || conformance);
    return translateConformance(conformance)
}

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');
  
    requirements.forEach(req => {

        const reqKey = req.getAttribute('key') || '';
        const reqVersion = parseFloat(req.getAttribute('version')) || 0; // Konvertiere zu einer Zahl
        const combinedReqKey = reqKey && reqVersion > 1 
            ? `${reqKey}-${reqVersion}` 
            : reqKey;
        
        const actorText = req.getAttribute('actor') || '';
        const titleText = req.getAttribute('title') || '';
        const conformanceText = getConformanceText(req.getAttribute('conformance') || '');
        const descriptionHTML = req.innerHTML.trim();

        const reqDiv = document.createElement('div');
        reqDiv.classList.add('requirement');
        if(combinedReqKey) {
            reqDiv.id = combinedReqKey;
        }
        conformance="SHALL"
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

    const hash = window.location.hash.substring(1)
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