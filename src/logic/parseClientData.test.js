const { parseClientData } = require('./parseClientData');

describe('parseClientData', () => {
    it('should return nulls and a default title for empty or invalid input', async () => {
        const result = await parseClientData({ payload: null });
        expect(result).toEqual({
            nombre_cliente: null,
            apellido_cliente: null,
            email_cliente: null,
            empresa_cliente: null,
            titulo_proyecto: 'Proyecto de IA (Datos no encontrados)',
        });
    });

    it('should parse a simple string payload with name, email, and company', async () => {
        const message = `
            Nombre: John Doe
            Email: john.doe@example.com
            Company: Example Corp
        `;
        const result = await parseClientData({ payload: message });
        expect(result).toEqual({
            nombre_cliente: 'John',
            apellido_cliente: 'Doe',
            email_cliente: 'john.doe@example.com',
            empresa_cliente: 'Example Corp',
            titulo_proyecto: 'Proyecto de IA para Example Corp',
        });
    });

    it('should parse a JSON string payload', async () => {
        const payload = JSON.stringify({
            message: 'Name: Jane Smith\\nEmail: jane.smith@test.com\\nCompany: Test Inc.'
        });
        const result = await parseClientData({ payload });
        expect(result).toEqual({
            nombre_cliente: 'Jane',
            apellido_cliente: 'Smith',
            email_cliente: 'jane.smith@test.com',
            empresa_cliente: 'Test Inc.',
            titulo_proyecto: 'Proyecto de IA para Test Inc.',
        });
    });

    it('should handle an object payload directly', async () => {
        const payload = {
            message: 'Client Name: Solo Name\\nCorreo electrónico: solo@name.org'
        };
        const result = await parseClientData({ payload });
        expect(result).toEqual({
            nombre_cliente: 'Solo',
            apellido_cliente: 'Name',
            email_cliente: 'solo@name.org',
            empresa_cliente: null,
            titulo_proyecto: 'Proyecto de IA',
        });
    });

    it('should handle a single name line and split it into first and last name', async () => {
        const message = 'Name: Jose de la Cruz\\nEmail: jose@cruz.com';
        const result = await parseClientData({ payload: message });
        expect(result.nombre_cliente).toBe('Jose');
        expect(result.apellido_cliente).toBe('De La Cruz');
    });

    it('should extract email from anywhere in the text if not labeled', async () => {
        const message = 'My name is Bob. My email is bob@builder.com. I work for Bob\'s Builders.';
        const result = await parseClientData({ payload: message });
        expect(result.email_cliente).toBe('bob@builder.com');
    });

    it('should generate a default project title if company is not found', async () => {
        const message = 'Name: No Company';
        const result = await parseClientData({ payload: message });
        expect(result.titulo_proyecto).toBe('Proyecto de IA');
    });
});
