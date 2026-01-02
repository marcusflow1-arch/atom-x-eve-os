import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * CSP Violation Report Handler
 * Logs Content Security Policy violations for monitoring
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse CSP violation report
        const report = await req.json();
        
        // Log violation details
        console.warn('CSP Violation Report:', {
            documentUri: report['csp-report']?.['document-uri'],
            violatedDirective: report['csp-report']?.['violated-directive'],
            blockedUri: report['csp-report']?.['blocked-uri'],
            sourceFile: report['csp-report']?.['source-file'],
            timestamp: new Date().toISOString()
        });

        // In production, you might want to store these in a monitoring entity
        // await base44.asServiceRole.entities.CSPViolation.create({
        //     document_uri: report['csp-report']?.['document-uri'],
        //     violated_directive: report['csp-report']?.['violated-directive'],
        //     blocked_uri: report['csp-report']?.['blocked-uri'],
        //     user_agent: req.headers.get('user-agent')
        // });

        return Response.json({ received: true }, { status: 204 });
    } catch (error) {
        console.error('CSP report error:', error);
        return Response.json({ error: 'Failed to process report' }, { status: 500 });
    }
});