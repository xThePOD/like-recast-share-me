import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import axios from 'axios';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = process.env.CAST_ID;
const FARCASTER_REACTIONS_API = `https://api.farcaster.xyz/v1/reactions/${CAST_ID}`;

// Check if the user has liked and recasted the cast
async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const response = await axios.get(FARCASTER_REACTIONS_API, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });

    const reactions = response.data.reactions;
    const hasLiked = reactions.some((reaction: any) => reaction.type === 'LIKE' && reaction.fid === fid);
    const hasRecasted = reactions.some((reaction: any) => reaction.type === 'RECAST' && reaction.fid === fid);

    return hasLiked && hasRecasted;
  } catch (error) {
    console.error('Error checking reactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Check Reactions Before Welcome',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;

  // Log the full context to check for 'fid'
  console.log(c);

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

  const fid = hub?.interactor?.fid || 'test-fid';  // Fallback for testing purposes

  if (fid) {
    const hasInteracted = await checkInteractions(fid);

    if (hasInteracted) {
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
              You have to follow, like, and recast first
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
              <Button.Link href={`https://warpcast.com/~/cast/${CAST_ID}`}>Follow, Like, and Recast</Button.Link>
            </div>
          </div>
        ),
        intents: [
          <Button value="enter">Try Again</Button>,
        ],
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
