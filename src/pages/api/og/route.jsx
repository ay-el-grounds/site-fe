import { ImageResponse } from 'next/og';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
 
    const hasTitle = searchParams.has('title');
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'Aluminum Grounds';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          fontSize: 40,
          color: '#D9261F',
          background: '#ECEA5F',
          width: '100%',
          height: '100%',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '3%',
            display: 'flex',
            flexDirection: 'column',
            background: '#D9261F',
            bottom: '0px',
          }}
          >
          </div>
          <h1>{title}</h1>
      </div>
    ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}