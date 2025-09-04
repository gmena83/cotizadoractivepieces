document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('request-form');
    const requestBodyInput = document.getElementById('request-body');
    const responseContainer = document.getElementById('response-container');
    const submitButton = form.querySelector('button');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const requestBody = requestBodyInput.value;
        if (!requestBody.trim()) {
            responseContainer.textContent = 'Por favor, ingrese los detalles de la solicitud.';
            return;
        }

        submitButton.disabled = true;
        responseContainer.textContent = 'Generando cotización...';

        try {
            const response = await fetch('/api/cotizador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requestBody }),
            });

            const result = await response.json();

            if (response.ok) {
                responseContainer.textContent = `Éxito: ${result.message}`;
            } else {
                responseContainer.textContent = `Error: ${result.error || 'Ocurrió un error en el servidor.'}`;
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            responseContainer.textContent = 'Error de red. No se pudo conectar con el servidor.';
        } finally {
            submitButton.disabled = false;
        }
    });
});
