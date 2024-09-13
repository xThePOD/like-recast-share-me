import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import axios from 'axios';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? 'default-api-key';
const CAST_ID = process.env.CAST_ID;
const FARCASTER_API_URL = 'https://api.farcaster.xyz/v1/reactions';  // Adjust for correct endpoint

async function checkReactions(fid: string): Promise<boolean> {
  try {
    const response = await axios.post(FARCASTER_API_URL, {
      id: {
        message_id: CAST_ID,
      },
      type: 'LIKE',  // or 'RECAST'
    }, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });

    const reactions = response.data.reactions;
    const hasLikedOrRecast = reactions.some((reaction: any) => reaction.fid === fid);

    return hasLikedOrRecast;
  } catch (error) {
    console.error('Error checking reactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Two Frame Example with Reaction Check',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;

  // Debugging: Log the full context
  console.log(c);  // Check if the 'fid' is present in the context

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
            Enter
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
    const hasReacted = await checkReactions(fid);

    if (hasReacted) {
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
              Welcome to the Pod!
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
          }}>
            <div style={{ color: 'white', fontSize: 60, marginTop: 30, padding: '0 120px' }}>
              Please like and recast to enter!
            </div>
          </div>
        ),
        intents: [
          <Button.Link href={`https://warpcast.com/~/cast/${CAST_ID}`}>Like and Recast</Button.Link>,
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
