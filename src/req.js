
document.addEventListener("DOMContentLoaded", () => {
    renderRequirements();
});

function renderRequirements() {
    const requirements = document.querySelectorAll('requirement');
  
    requirements.forEach(req => {
      const getTextAndRemove = (selector) => {
        const el = req.querySelector(selector);
        if (!el) return '';
        const text = el.textContent.trim();
        el.remove();
        return text;
      };
      const getHTMLAndRemove = (selector) => {
        const el = req.querySelector(selector);
        if (!el) return '';
        const html = el.innerHTML.trim();
        el.remove();
        return html;
      };
  
      const reqID         = req.getAttribute('id') || '';
      const targetText    = getTextAndRemove('target');
      const titleText     = getTextAndRemove('title');
      const descriptionHTML = getHTMLAndRemove('description');
  
      const requirementDiv = document.createElement('div');
      requirementDiv.classList.add('requirement');
  
      const headingParts = [reqID, targetText, titleText].filter(Boolean);
      if (headingParts.length > 0) {
        const heading = document.createElement('div');
        heading.classList.add('heading');
        heading.textContent = headingParts.join(' - ');
        requirementDiv.appendChild(heading);
      }
  
      if (descriptionHTML) {
        const descP = document.createElement('p');
        descP.innerHTML = `${descriptionHTML} [<=]`;
        requirementDiv.appendChild(descP);
      }
  
      req.appendChild(requirementDiv);
    });
  }
  