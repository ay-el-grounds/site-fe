export default async (req, res) => {
  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const accessToken = process.env.AIRTABLE_ACCESS_TOKEN;
    const userTable = process.env.AIRTABLE_USER_TABLE;

    if (!baseId || !accessToken) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/${userTable}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: email,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText} - ${JSON.stringify(responseData)}`);
      }

      res.status(200).json({ success: true, data: responseData });
    } catch (error) {
      console.error('Error creating Airtable record:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
};

const accessToken = process.env.AIRTABLE_ACCESS_TOKEN;


