import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import axios from 'axios';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = process.env.CAST_ID;
const FRAME_URL = 'https://like-recast-share-me.vercel.app/api';  // The URL of your embedded frame
const COMPOSE_URL = `https://warpcast.com/~/compose?text=Check%20out%20this%20awesome%20content!&embeds[]=${FRAME_URL}`;

async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://api.neynar.com/v2/farcaster/cast?identifier=${CAST_ID}&type=hash`, {
      headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
    });

    const cast = response.data.cast;
    const hasLiked = cast.reactions.likes.some((like: any) => like.fid === fid);
    const hasRecast = cast.reactions.recasts.some((recast: any) => recast.fid === fid);

    return hasLiked && hasRecast;
  } catch (error) {
    console.error('Error checking interactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Two Frame Example with Interaction Gate',
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
    const canEnter = await checkInteractions(fid);

    if (canEnter) {
      // If the user has liked and recasted, show the second frame
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
      // If the user has not liked and recasted, ask them to do so
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
          <Button.Link href={COMPOSE_URL}>Share with Pre-filled Message</Button.Link>,  // Pre-filled composed message button
          <Button value="enter">Try Again</Button>,  // Retry button to check interactions again
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
