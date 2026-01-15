// src/pages/api/settings.js
import fs from 'fs/promises';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'easy-seo/src/data/site-config.json');

export async function get({ request }) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  }

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error reading config file', error: error.message }), { status: 500 });
  }
}

export async function post({ request }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await request.json();
    await fs.writeFile(configPath, JSON.stringify(body, null, 2), 'utf-8');
    return new Response(JSON.stringify({ message: 'Settings saved successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error saving config file', error: error.message }), { status: 500 });
  }
}
