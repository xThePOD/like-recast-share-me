import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? '0D6B6425-87D9-4548-95A2-36D107C12421';
const CAST_ID = '0x5d38e284';  // Your actual cast ID
const FOLLOWEE_ID = '791835';  // Your Farcaster ID

async function getReactions(castId: string): Promise<any> {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${castId}&type=hash`, {
    headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
  });
  const data = await response.json();
  console.log('Reactions data:', JSON.stringify(data, null, 2));
  return data;
}

async function hasUserReacted(fid: string, castId: string): Promise<boolean> {
  const reactions = await getReactions(castId);
  const hasLiked = reactions.cast.reactions.likes.some((like: any) => like.fid === fid);
  const hasRecasted = reactions.cast.reactions.recasts.some((recast: any) => recast.fid === fid);
  console.log(`User ${fid} reactions - Liked: ${hasLiked}, Recasted: ${hasRecasted}`);
  return hasLiked && hasRecasted;
}

async function checkFollowStatus(followerFid: string, followeeFid: string): Promise<boolean> {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/following/${followerFid}`, {
    headers: { 'Authorization': `Bearer ${NEYNAR_API_KEY}` }
  });
  const data = await response.json();
  const isFollowing = data.following.some((follow: any) => follow.fid === followeeFid);
  console.log(`User ${followerFid} following status for ${followeeFid}: ${isFollowing}`);
  return isFollowing;
}

async function checkInteractions(fid: string): Promise<boolean> {
  try {
    const hasReacted = await hasUserReacted(fid, CAST_ID);
    const isFollowing = await checkFollowStatus(fid, FOLLOWEE_ID);
    return hasReacted && isFollowing;
  } catch (error) {
    console.error('Error checking interactions:', error);
    return false;
  }
}

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Check Interactions with Neynar',
}).use(neynar({
  apiKey: NEYNAR_API_KEY,
  features: ['interactor'],
}));

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const hub = (c as any).hub;
  const fid = hub?.interactor?.fid;

  console.log('Debug - Full context:', JSON.stringify(c, null, 2));
  console.log('Debug - FID:', fid);

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
            Press Enter to Check Interactions
          </div>
        </div>
      ),
      intents: [
        <Button value="enter">Enter</Button>,
      ],
    });
  }

  if (!fid) {
    console.error('No Farcaster ID found in the context');
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
          <div style={{ color: 'white', fontSize: 40, marginTop: 30, padding: '0 60px' }}>
            Error: No Farcaster ID found. Please ensure you're signed in to Farcaster and try again.
          </div>
        </div>
      ),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    });
  }

  try {
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
            <div style={{ color: 'white', fontSize: 40, marginTop: 30, padding: '0 60px' }}>
              Please like, recast, and follow to proceed.
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
              <Button.Link href={`https://warpcast.com/~/cast/${CAST_ID}`}>Like, Recast, and Follow</Button.Link>
            </div>
          </div>
        ),
        intents: [
          <Button value="enter">Check Again</Button>,
        ],
      });
    }
  } catch (error) {
    console.error('Error in interaction check:', error);
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
          <div style={{ color: 'white', fontSize: 40, marginTop: 30, padding: '0 60px' }}>
            An error occurred while checking interactions. Please try again.
          </div>
        </div>
      ),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);