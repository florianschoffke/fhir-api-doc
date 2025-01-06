
document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
    hashLinkHighlight();
});

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');
  
    requirements.forEach(req => {

        const reqID = req.getAttribute('id') || '';
        const reqVersion = req.getAttribute('version') || '';
        const combinedReqID = reqID ? `${reqID}${reqVersion ? `-${reqVersion}` : ''}` : '';
        const targetText = req.getAttribute('target') || '';
        const titleText = req.getAttribute('title') || '';
        const descriptionHTML = req.innerHTML.trim();

        const reqDiv = document.createElement('div');
        reqDiv.classList.add('requirement');
        if(reqID) reqDiv.id = reqID;

        const headingParts = [
            combinedReqID, 
            targetText, 
            titleText
        ].filter(Boolean);

        if (headingParts.length > 0) {
            const heading = document.createElement('div');
            heading.classList.add('heading');
            heading.textContent = headingParts.join(' - ');
            reqDiv.appendChild(heading);
        }

        if (descriptionHTML) {
            const descP = document.createElement('div');
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