
document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
});

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');
    requirements.forEach(req => {
        const reqID = req.getAttribute('id');
        const title = req.querySelector('title')?.textContent ?? '';
        const target = req.querySelector('target')?.textContent ?? '';
        const description = req.querySelector('description')?.textContent ?? '';

        const requirementDiv = document.createElement('div');
        requirementDiv.classList.add('requirement');

        let headingParts = [];
        if (reqID)  headingParts.push(reqID);
        if (target) headingParts.push(target);
        if (title)  headingParts.push(title);

        if (headingParts.length > 0) {
            const heading = document.createElement('h2');
            heading.textContent = headingParts.join(' - ');
            requirementDiv.appendChild(heading);
        }
  
        if (description) {
            const descP = document.createElement('p');
            descP.textContent = description;
            requirementDiv.appendChild(descP);
        }
        document.body.appendChild(requirementDiv);
        req.remove();
    });
}