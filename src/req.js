
document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
    hashLinkHighlight();
});

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');
  
    requirements.forEach(req => {

        const reqID = req.getAttribute('id') || '';
        const reqVersion = parseFloat(req.getAttribute('version')) || 0; // Konvertiere zu einer Zahl
        const combinedReqID = reqID && reqVersion > 1 
            ? `${reqID}-${reqVersion}` 
            : reqID;
        
        const targetText = req.getAttribute('target') || '';
        const titleText = req.getAttribute('title') || '';
        const descriptionHTML = req.innerHTML.trim();

        const reqDiv = document.createElement('div');
        reqDiv.classList.add('requirement');
        if(combinedReqID) {
            reqDiv.id = combinedReqID;
        }

        const headingParts = [
            combinedReqID, 
            targetText, 
            titleText
        ].filter(Boolean);

        if (headingParts.length > 0) {
            const heading = document.createElement('p');
            heading.classList.add('heading');
            heading.textContent = headingParts.join(' - ');
            reqDiv.appendChild(heading);
            if(combinedReqID) {
                const anchor = document.createElement('a');
                anchor.href = `#${combinedReqID}`;
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
            descP.innerHTML = `${descriptionHTML} <span class="gem-req-workitem-fields-end-inner">[<=]</span>`;
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