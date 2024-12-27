// Global variables for labels
window.gemIGLabels = window.gemIGLabels || {
    GEM_Download_Button_Image: "Bild herunterladen",
    GEM_Download_Button_SVG: "SVG herunterladen"
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
    document.querySelectorAll('.gem-ig-svg-container svg').forEach(svg => {
        try {
            const svgString = serializer.serializeToString(svg);
            const svgWithProlog = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
            const blob = new Blob([svgWithProlog], { type: 'image/svg+xml' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'downloaded.svg';
            downloadLink.classList.add('gem-ig-download-btn');
            downloadLink.innerText = window.gemIGLabels.GEM_Download_Button_SVG;

            const downloadLinkWrapper = document.createElement('div');
            downloadLinkWrapper.classList.add('gem-ig-svg-downloadlink-wrapper');
            downloadLinkWrapper.appendChild(downloadLink);
            svg.parentElement.append(downloadLinkWrapper);
        } catch (error) {
            console.error('Error downloading SVG:', error);
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

// Set up event listeners to initialize functions when the page has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        resizeSVGs();
        downloadSVG();
        downloadImages();
        enableExamples();
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