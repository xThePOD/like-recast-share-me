import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = process.env.CAST_ID;

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Check Reactions and Automate with Neynar SDK',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;
  const fid = hub?.interactor?.fid;

  // If the user presses "Enter"
  if (!buttonValue || buttonValue !== 'enter') {
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
            Press Enter
          </div>
        </div>
      ),
      intents: [
        <Button value="enter">Enter</Button>,
      ],
    });
  }

  if (fid) {
    // Neynar SDK checks if the user has liked or recasted the cast
    const hasLiked = await hub.interactor.like({ castId: CAST_ID });
    const hasRecasted = await hub.interactor.recast({ castId: CAST_ID });

    if (hasLiked && hasRecasted) {
      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #432889, #17101F)',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
              Welcome to the POD!
            </div>
          </div>
        ),
      });
    } else {
      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #432889, #17101F)',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            position: 'relative',
          }}>
            <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
              You need to follow, like, and recast first.
            </div>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '20px',
              borderRadius: '10px',
            }}>
              <button onClick={async () => {
                await hub.interactor.like({ castId: CAST_ID });
                await hub.interactor.recast({ castId: CAST_ID });
                alert('Liked and Recasted!');  // Temporary confirmation for the user
              }} style={{
                color: 'white',
                background: 'blue',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                Like and Recast Automatically
              </button>
            </div>
          </div>
        ),
      });
    }
  } else {
    return c.res({
      image: <div style={{ color: 'white', fontSize: 60 }}>Error: No Farcaster ID found.</div>
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
