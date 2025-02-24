import fhir from './fhir.js';
import utils from './utils.js';

// Global variables for labels
window.gemIGLabels = window.gemIGLabels || {
    GEM_Download_Button_Image: "Bild herunterladen",
    GEM_Download_Button_SVG: "SVG herunterladen",
    GEM_FHIR_Expectation_SHALL: "MUSS",
    GEM_FHIR_Expectation_SHOULD: "KANN",
    GEM_FHIR_Expectation_SHOULD_NOT: "DARF NICHT",
    GEM_FHIR_Expectation_MAY: "OPTIONAL",
    GEM_FHIR_Parameter_Label: "Parameter",
    GEM_FHIR_Type_Label: "Type",
    GEM_FHIR_Expectation_Label: "Service Anforderung",
    GEM_FHIR_Documentation_Label: "Beschreibung"
};


// Function to resize all SVGs to match the width of their parent container while maintaining aspect ratio
function resizeSVGs() {
    document.querySelectorAll('.gem-ig-svg-container svg').forEach(svg => {
        try {
            const parent = svg.parentElement;
            const parentWidth = parent.clientWidth;

            if (parentWidth > 0) {
                svg.style.width = parentWidth + 'px';
                const aspectRatio = svg.viewBox.baseVal.width / svg.viewBox.baseVal.height;
                svg.style.height = (parentWidth / aspectRatio) + 'px';
            }
        } catch (error) {
            console.error('Error adjusting SVG size:', error);
        }
    });
}

// Function to create a download link for each SVG, allowing users to download them as files
function downloadSVG() {
    const serializer = new XMLSerializer();

    function createDownloadButton(svgContent, container, fileName) {
        const svgWithProlog = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent;
        const blob = new Blob([svgWithProlog], { type: 'image/svg+xml' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.classList.add('gem-ig-download-btn');
        downloadLink.innerText = window.gemIGLabels?.GEM_Download_Button_SVG || 'Download SVG';

        const downloadLinkWrapper = document.createElement('div');
        downloadLinkWrapper.classList.add('gem-ig-svg-downloadlink-wrapper');
        downloadLinkWrapper.appendChild(downloadLink);
        container.append(downloadLinkWrapper);
    }

    document.querySelectorAll('.gem-ig-svg-container svg').forEach(svg => {
        try {
            const svgString = serializer.serializeToString(svg);
            createDownloadButton(svgString, svg.parentElement, 'downloaded.svg');
        } catch (error) {
            console.error('Error processing embedded SVG:', error);
        }
    });

    document.querySelectorAll('.gem-ig-svg-container img[src$=".svg"]').forEach(img => {
        try {
            const imgUrl = img.src;
            fetch(imgUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch SVG: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(svgContent => {
                    createDownloadButton(svgContent, img.parentElement, 'downloaded.svg');
                })
                .catch(error => {
                    console.error('Error fetching SVG from <img>:', error);
                });
        } catch (error) {
            console.error('Error processing <img> tag:', error);
        }
    });
}

// Function to create a download link for each image, allowing users to download them as PNG files
function downloadImages() {
    document.querySelectorAll('.gem-ig-img-container img').forEach(img => {
        try {
            const imgClone = new Image();
            imgClone.src = img.src;
            imgClone.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgClone.naturalWidth;
                    canvas.height = imgClone.naturalHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(imgClone, 0, 0, imgClone.naturalWidth, imgClone.naturalHeight);
                    canvas.toBlob(blob => {
                        try {
                            const downloadLink = document.createElement('a');
                            downloadLink.href = URL.createObjectURL(blob);
                            downloadLink.download = imgClone.src.split('/').pop();
                            downloadLink.classList.add('gem-ig-download-btn');
                            downloadLink.innerText = window.gemIGLabels.GEM_Download_Button_Image;

                            const downloadLinkWrapper = document.createElement('div');
                            downloadLinkWrapper.classList.add('gem-ig-img-downloadlink-wrapper');
                            downloadLinkWrapper.appendChild(downloadLink);
                            img.parentElement.append(downloadLinkWrapper);
                        } catch (error) {
                            console.error('Error creating download link for image:', error);
                        }
                    }, 'image/png');
                } catch (error) {
                    console.error('Error drawing image on canvas:', error);
                }
            };
        } catch (error) {
            console.error('Error loading image:', error);
        }
    });
}

function enableExamples() {
    document.querySelectorAll('.gem-ig-example').forEach(exampleElement => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('gem-ig-example-wrapper');

        const header = document.createElement('div');
        header.classList.add('gem-ig-example-header');
        wrapper.appendChild(header);

        const title = document.createElement('span');
        title.textContent = exampleElement.getAttribute('data-title') || '';
        title.classList.add('gem-ig-example-title');

        const toggleButton = document.createElement('button');
        toggleButton.classList.add('gem-ig-example-toggle');
        
        header.appendChild(toggleButton);
        header.appendChild(title);

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('gem-ig-example-content');
        contentWrapper.innerHTML = exampleElement.innerHTML;
        contentWrapper.style.display = 'none';
        wrapper.appendChild(contentWrapper);

        toggleButton.textContent = '▼';
        // Add button click
        const toggleContent = ()  => {
            if (contentWrapper.style.display === 'none') {
                contentWrapper.style.display = 'block';
                toggleButton.textContent = '►';
            } else {
                contentWrapper.style.display = 'none';
                toggleButton.textContent = '▼';
            }
        }
        toggleButton.addEventListener('click', toggleContent);
        title.addEventListener('click', toggleContent);

        exampleElement.parentNode.insertBefore(wrapper, exampleElement);
        exampleElement.remove(); // Remove original
    });
}


function renderCapabilityStatementData(data, resourceType, what, parent) {
    const fhirData = fhir.parseFhirCapabilityStatement(data, resourceType);
    if(what == 'search') {
        if (fhirData.searchParams?.length) {
            const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
                definition ? `<a href="${definition}" target="_blank">${name}</a>` : name,
                `<code>${type}</code>`,
                documentation,
                expectation
            ]);
            parent.appendChild(utils.createElement('div', { children: [utils.createTable([
                window.gemIGLabels.GEM_FHIR_Parameter_Label,
                window.gemIGLabels.GEM_FHIR_Type_Label,
                window.gemIGLabels.GEM_FHIR_Documentation_Label,
                window.gemIGLabels.GEM_FHIR_Expectation_Label
            ], searchParametersRows, true)] }));
        }
    }
    else if(what == 'include') {
        if (fhirData.searchInclude || fhirData.searchRevInclude) {
            const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
                fhirData.searchInclude?.[i] || '',
                fhirData.searchRevInclude?.[i] || ''
            ]);
            parent.appendChild(utils.createElement('div', { classes: [], children: [utils.createTable(['Include', 'RevInclude'], rows)] }));
        }
    }
}


function fhirData() {
    const capDivs = document.querySelectorAll('div[data-fhir-capabilitystatement-url]');
    capDivs.forEach(div => {
        const capUrl = div.getAttribute('data-fhir-capabilitystatement-url');
        const resourceType = div.getAttribute('data-fhir-resource-type');
        const what = div.getAttribute('data-fhir-capabilitystatement-render');
        if(capUrl && resourceType) {
            utils.loadData(capUrl).then(data => renderCapabilityStatementData(data, resourceType, what, div));
        }
    });
}


function renderCodeBlocks() {
    document.querySelectorAll('code').forEach(codeElement => {
        // Überprüfen, ob das übergeordnete Element ein <pre>-Tag ist
        const parentElement = codeElement.parentElement;
        if (parentElement && parentElement.tagName.toLowerCase() === 'pre') {
            const classes = Array.from(codeElement.classList);
            const languageClass = classes.find((cls) => cls.includes("language-"));
            
            if (languageClass && !languageClass.includes('plaintext')) {
                const button = createCopyButton(codeElement.textContent);
                parentElement.insertBefore(button, codeElement);
            }
        }
    });
}


function convertBibliographyToLink(literatureData) {

    function replaceMatches(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let parent = node.parentNode;
            let changed = false;
            let newHTML = text;

            literatureData.forEach(entry => {
                let regex = new RegExp(`\\[${entry.key}\\]`, "g");
                if (regex.test(text)) {
                    changed = true;
                    newHTML = newHTML.replace(regex, `<a href="${entry.link}" class="literature-link" title="${entry.author}: ${entry.title}" data-author="${entry.author}" data-title="${entry.title}" target="_blank">[${entry.key}]</a>`);
                }
            });
            if (changed) {
                let tempSpan = document.createElement("span");
                tempSpan.innerHTML = newHTML;
                parent.replaceChild(tempSpan, node);
            }

        } else {
            Array.from(node.childNodes).forEach(replaceMatches);
        }
    }

    replaceMatches(document.body);

}
// Make public
window.convertBibliographyToLink = convertBibliographyToLink;

// Set up event listeners to initialize functions when the page has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        resizeSVGs();
        downloadSVG();
        downloadImages();
        enableExamples();
        renderCodeBlocks();
        fhirData();
    } catch (error) {
        console.error('Error initializing functions:', error);
    }
});

// Set up event listener to resize SVGs when the browser window is resized
window.addEventListener('resize', () => {
    try {
        resizeSVGs();
    } catch (error) {
        console.error('Error adjusting SVG size on window resize:', error);
    }
});

export default {
    convertBibliographyToLink
};