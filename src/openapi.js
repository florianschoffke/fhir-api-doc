import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';

export function renderOpenApi() {
    const nodes = document.querySelectorAll('.ig-openapi');
    
    nodes.forEach(node => {
        const openapiUrl = node.getAttribute('data-openapi-url');
        
        if (!openapiUrl) {
            console.warn('OpenAPI node found without data-openapi-url attribute', node);
            return;
        }
        
        try {
            SwaggerUI({
                url: openapiUrl,
                domNode: node
            });
        } catch (error) {
            console.error('Failed to render SwaggerUI', error);
        }
    });
    
    return nodes.length;
}

export function initOpenApi() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderOpenApi);
    } else {
        renderOpenApi();
    }
}

// Auto-initialize if not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    initOpenApi();
}
