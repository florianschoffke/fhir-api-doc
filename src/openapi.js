import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';

document.addEventListener("DOMContentLoaded", () => {
    renderOpenApi();
});


function renderOpenApi() {
    document.querySelectorAll('.ig-openapi').forEach(node => {
        const openapiUrl = node.getAttribute('data-openapi-url')
        if(openapiUrl) {
            SwaggerUI({
                url: openapiUrl,
                domNode: node
            });
        }
    });
    
}
