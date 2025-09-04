// Extracted and refactored from step_7 of the original workflow.
// This module parses client identity and generates a project title from a raw text input.

// --- Helper Functions ---
function toStr(v) { return typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v); }
function normNL(s) { return s.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n'); }
function cleanAll(s) { return normNL(s).trim(); }
function titleCase(s) { return s.split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ').trim(); }
function squeeze(s) { return s.replace(/\s+/g, ' ').trim(); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function findLabeledLine(text, labels) {
  const lab = labels.map(l => escapeRe(l)).join('|');
  const re = new RegExp(`^(?:\\s*(?:${lab})\\s*[:\\-–—]\\s*)(.+)$`, 'gmi');
  let m;
  while ((m = re.exec(text)) !== null) {
    const v = m[1]?.trim();
    if (v) return v.replace(/\s+$/, '');
  }
  return null;
}

function extractEmailAnywhere(text) {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0] : null;
}

function splitFullName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: null, last: null };
  if (parts.length === 1) return { first: titleCase(parts[0]), last: null };
  return { first: titleCase(parts[0]), last: titleCase(parts.slice(1).join(' ')) };
}

/**
 * Parses client data from a raw input object or string.
 * @param {object} inputs - The input object, expected to have a `payload` property.
 * @returns {Promise<object>} An object containing the parsed client data.
 */
async function parseClientData(inputs) {
  const inVal = inputs?.payload;
  let dataObject = null;

  if (typeof inVal === 'string') {
    try {
      dataObject = JSON.parse(inVal);
    } catch (e) {
      dataObject = { message: inVal };
    }
  } else if (inVal && typeof inVal === 'object') {
    dataObject = inVal;
  }

  if (!dataObject) {
    return {
      nombre_cliente: null,
      apellido_cliente: null,
      email_cliente: null,
      empresa_cliente: null,
      titulo_proyecto: 'Proyecto de IA (Datos no encontrados)',
    };
  }

  const messageRaw = toStr(dataObject.message || '');
  const msg = cleanAll(messageRaw);

  if (!msg) {
    return {
      nombre_cliente: null,
      apellido_cliente: null,
      email_cliente: null,
      empresa_cliente: null,
      titulo_proyecto: 'Proyecto de IA (Datos no encontrados)',
    };
  }

  const firstNameLine = findLabeledLine(msg, ["Client's Name", "Client Name", "Name", "Nombre", "Nombre del cliente"]);
  const lastNameLine = findLabeledLine(msg, ["Last name", "Last Name", "Apellido", "Apellidos"]);
  const companyLine = findLabeledLine(msg, ["Company", "Empresa", "Compañía"]);
  const emailLine = findLabeledLine(msg, ["Email", "E-mail", "Correo", "Correo electrónico"]);

  let email = emailLine || extractEmailAnywhere(msg);

  let firstName = null;
  let lastName = null;

  if (firstNameLine && !lastNameLine) {
    const guess = splitFullName(firstNameLine);
    firstName = guess.first;
    lastName = guess.last;
  } else {
    firstName = firstNameLine ? titleCase(squeeze(firstNameLine)) : null;
    lastName  = lastNameLine ? titleCase(squeeze(lastNameLine)) : null;
  }

  const company = companyLine ? squeeze(companyLine) : null;

  const projectTitle = company ? `Proyecto de IA para ${company}` : 'Proyecto de IA';

  return {
    nombre_cliente: firstName,
    apellido_cliente: lastName,
    email_cliente: email,
    empresa_cliente: company,
    titulo_proyecto: projectTitle,
  };
}

module.exports = { parseClientData };
