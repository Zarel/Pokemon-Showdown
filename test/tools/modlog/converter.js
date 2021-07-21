/**
 * Tests for modlog conversion tools
 * @author Annika
 */
'use strict';

const assert = require('assert').strict;
const converter = require('../../../tools/modlog/converter');
const ml = require('../../../server/modlog');

const garfieldCopypasta = [
	`[2020-08-24T03:52:00.917Z] (staff) AUTOLOCK: [guest903036] [127.0.0.1]: "Now where could my pipe be?" This... I always come to this, because I was a young man, I'm older now, and I still don't have the secrets, the answers, so this question still rings true, Jon looks up and he thinks: "Now where could my pipe be?", and then it happens, you see it, you see... it's almost like divine intervention, suddenly, it is there, and it overpowers you, a cat is smoking a pipe. It is the mans pipe, it's Jon's pipe, but the cat, this cat, Garfield, is smoking the pipe, and from afar, and from someplace near, but not clear... near but not clear, the man calls out, Jon calls out, he is shocked. "Garfield!" he shouts. Garfield, the cats name. But let's take a step back. Let us examine this from all sides, all perspectives, and when I first came across this comic strip, I was at my fathers house. The newspaper had arrived, and I picked it up for him, and brought it`,
	`inside. I organized his sections for him and then, yes, the comic strip section fell out from somewhere in the middle, landed on the kitchen floor. I picked up the picture pages and saw up somewhere near the top of this strip, just like Jon, I too was wearing an aquamarine shirt, so I thought, "Hah! Interesting, I'll have to see this later." I snipped out the little comic and held onto it, and 5 days later, I re-examined, and it gripped me, I needed to find out more about this. The information I had was minimal, but enough. An orange cat named Garfield. Okay, that seemed to be the linchpin of this whole operation. Yes, another clue, a signature on the bottom right corner, a mans name, Jim Davis. Yes, I'm onto it for sure, so. 1. Garfield, orange cat, and 2. Jim Davis, the creator of this cat, and that curiously plain man. I did not know at the time that his name was Jon. The strip, you see, had no mention of this mans name, and, I've never seen it before.`,
	` But I had these clues. Jim Davis, Garfield. And then I saw more, I spotted the tiny copyright at the upper left corner, copyright 1978, to... what is this? Copyright belongs to a "PAWS Incorporated"? I used the local library and mail services to track down the information I was looking for. Jim Davis, a cartoonist, who created a comic strip about a cat, Garfield, and a man, Jon Arbuckle. Well from that point on I made sure I read the Garfield comic strips, but as I read each one, as each day passed, the strips seemed to resonate with me less and less. I sent letters to PAWS Incorporated, long letters, pages upon pages, asking if Mr. Jim Davis could somehow publish just the one comic, over and over again, it would be meditative, I wrote, the strength of that, could you imagine? But, no response. The strips lost their power, and eventually I stopped reading, but... I did not want my perceptions deluded so I vowed to read the pipe strip over and over again.`,
	` That is what I called it, "The Pipe Strip", The Pipe Strip. Everything about it is perfect, I can only describe it as a miracle creation, something came together, the elements aligned. It is like the comets, the cosmic orchestra that is up there over your head. The immense, enormous void is working all for one thing, to tell you one thing. Gas, and rock and purity and... Nothing! I will say this, when I see the pipe strip, and I mean every single time I look at the lines, the colors, the shapes, that make up the three panel comic, I see perfection. Do I find perfection in many things? Some things I would say, some things are perfect. And this is one of them. I can look at the little tuft of hair on Jon Arbuckle's head, it is the perfect shade, the purple pipe in Garfield's mouth, how could a mere mortal even make this? I have a theory about Jim Davis, after copious research, and yes of course now we have the internet, and all this information is now readily`,
	` available but... Jim Davis, he used his life experiences to influence his comic. Like I mentioned before, none of them seemed to have the weight of The Pipe Strip, but you have to wonder about the man who is able to even, just once, create the perfect form, a literally flawless execution of art, brilliance! Just as an award, I think there is a spiritual element at work. I've seen my share of bad times, and when you have something, well, it's just, emotions and neurons in your brain, but something tells you it's the truth, truth's radiant light. Garfield the cat? Neurons in my brain, it's, it's harmony you see, Jon and Garfield, it's truly harmony, like a continuous looping everlasting harmony. The lavender chair, the brown end table, the salmon colored wall, the forest green carpet, and Garfield is hunched, perched perhaps, with the pipe stuck firmly between his jowls, his tail curls around. It's more then shapes too because... I... Okay, stay with me, I've done`,
	` this experiment several times. You take the strip, you trace only the basic elements. You can do anything, you can simplify the shapes down to just blobs, just outlines, but it still makes sense. You can replace the blobs with magazine cutouts of other things, replace Jon Arbuckle with a car parked in a driveway sideways, cut that out of a magazine, stick it in, replace it there in the second panel with a, a food processor, okay. And then we put a picture of the planet in the third panel over Garfield. It still works. These are universal proportions, I don't know how best to explain why it works, I have studied The Pipe Strip, and analyzed Jon and Garfield's proportions against several universal mathematical constants: e, pi, the Golden Ratio, the Feigenbaum constants and so on, and it's surprising, scary, how things align. You can take just tiny pieces of the pipe strip for instance, take Jon's elbow from the second panel, and take that and project it over Jon's entire shape in the second panel,`,
	` and you'll see a near perfect Fibonacci sequence emerge. It's eerie to me, and it makes you wonder if you were in the presence of a deity, if there is some larger hand at work. There is no doubt in my mind that Jim Davis is a smart man. Jim Davis is capable of anything, to me, he is remarkable, but this is so far beyond that. I think we might see that this work of art is revered and respected in years to come. Jim Davis is possibly a new master of the craft, a genius of the eye, they very well may say the same things about Jim Davis in 500 years that we say about the great philosophical and artistic masters from centuries ago. Jim Davis is a modern day Socrates, or Da Vinci. Mixing both striking visual beauty with classical, daring, unheard of intellect. Look, he combines these things to make profoundly simple expressions. This strip is his masterpiece, the pipe strip, is his masterpiece, and it is a masterpiece and a marvel. I often look at Garfield's... particular pose in this strip, he is poised`,
	` and statuesque. And this cat stares reminiscent of the fiery gaze often found in religious iconography. But still his eyes are playful, lying somewhere between the solemn father's expression, and Rembrandt's Return of the Prodigal Son, and the coy smirk of Da Vinci's St. John the Baptist, his ears stick up, signifying a peak readiness. It's as if he could at any moment pounce. He is after all a close relative and descendant of the mighty jungle cats of Africa that could leap after prey. You could see the power drawn into Garfield's hindquarters, powerful haunches indeed. The third panel. And I'm just saying this now, this, this is just coming to me now, the third panel of The Pipe Strip is essentially a microcosm for the entire strip itself. All the power dynamics, the struggle for superiority, right? Who has the pipe? Where is the pipe? All of that is drawn, built, layered into Garfield's iconic pose here, you can see it in the curl of his tail, Garfield's ear whiskers stick up on end, the smoke billows`,
	` upwards drawing the eye upward, the increasing scope, I'm just... amazed, really, that after 33 years of reading and analyzing the same comic strip, I'm able to find new dimensions. It's a testament the work. For six years I delved into tobacco research, because... can a cat smoke? This is a metaphysical question. Yes, can any cat smoke? Do we know? Can just Garfield smoke? The research says no, nicotine poisoning can kill animals, especially household pets. All it takes is the nicotine found in as little as a single cigarette. Surely Jon's pipe holds a substantial amount of tobacco, and it is true that pets living in the homes of smokers are nearly 25% more likely to develop some form of cancer... most likely due to second hand smoke. But these are facts of smoking, and its tolls on our world. But after visiting two tobacco processing plants in Virginia, and the Philip Morris cigarette manufacturing facility, I came no closer to cracking the meaning. I was looking for any insight, a detective of a homicide`,
	` case has to look at every angle. So I'm always taking apart the pipe strip. I have focused on every minutiae, every detail of this strip. Jon Arbuckle's clothing. I have replicas, I'm an expert in textiles, so you see the smoking thing was a hangup for me What was the statement here? Until... and this is key... this is the breakthrough, the pipe is not a pipe really. Obviously there is symbolism at work here. I saw that from the beginning and I looked at the literal aspect of the strip to gain insight into the metaphors at play, I worked at a newspaper printing press for 18 months in the late 1980's, I was learning the literal to form the gestural, the sub-literal, the in-between. Jon reading the newspaper means so much more then just... Jon reading the newspaper. But how can you ever hope to decipher the puzzle without knowing everything there is to know about newspapers? Okay, for example, Jon holds his paper up with his left hand, thumb gripping the interior. I learned that this particular grip here is the`,
	` newspaper grip of 19th century aristocrats. And this aristocrat grip was a point of contention that influenced the decision to move forward Prohibition in the United States in the early 20th century. So Jon's hand position is much more then that, it is a comment on class war, and the resulting reactionary culture. But I didn't know about the aristocratic newspaper grip until I came across some microfiche archives at the printing press, it's about information. You have to take it apart... and the breakthrough on a smoking cat came late. Just 8 years ago actually. A smoking cat, is an industry term, it's what the smoking industry calls a tattletale teenager who tells on his friends after they've all tried smoking for the first time, and it is actually a foreign translation, bastardization of the term smoking rat. But the phrase was confused when secret documents when back and forth between China and America These documents are still secret, and the only reason I know about the term is because I know a man, my friend...`,
	` let's call him Timothy, yes, it's a fake name for his protection. Timothy worked for Philip Morris for 16 years and he had seen the documents. When he told me, it was an "Aha!" moment. And he said "But how? How could this cartoonist Jim Davis know about this obscure term from the mid 70's used exclusively  "Yes, a cat in this room would have a hard time differentiating the wall from the floor." Add to that cats' known spatial confusion and you have the makings of a cat rage room. Now she informed me this isn't exactly common knowledge among cat owners. But a seasoned cat owner, or someone particularly perceptive would've picked up on it. So what's incredible here is not only is Garfield's behavior symbolic of the devil and all the evil constructs in the world, but, but, but, but also... it is rooted in science and scientific fact, look at that. You cannot spell fact without cat. Heh. Just a little joke there. Just some wordplay but, getting back on track, and you can't spell track without cat, okay, okay okay. I digress.`,
	` I gotcha, I gotcha. Enough, kidding around. It is established here that Garfield is in a rage, an ultimate rage of fury and hatred caused by colorblindness. We know the what, we know the why, but let us examine the how. The how of his rage is particularly interesting here, we've looked at his posture and called it powerful, in control... statuesque, et cetera, et cetera. Composed rage. It's peculiar, and I've talked to a number of psychologists and psychiatrists and even a couple of anger management therapists about this concept. Could we see the same kind of behavior in a human? Is Garfield representative of something more specific then just chaos and rage? Deciphering is going to take some perseverance for sure. The psychologists pointed to a phenomenon in humans and yes, I believe one of the anger management counselors brought it up as well. The idea that people often times will bottle their rage. Garfield the cat here, well, he could be bottling his anger inside shoving it deep into his cat gut to ignore and deal with`,
	` at a later time. Uhh, well, no, that's not exactly right. Garfield has already acted out, he's already stolen the pipe. He's smoking the pipe, he's already dealt with his anger. He's already lashed out, so, psychologically, what is going on here? What is this cat doing and how does it impact his owner Jon Arbuckle? Psychologically. Well Garfield is angry, he is acting on his anger, but is this passive anger or aggressive anger? Passive. It is passive because if Garfield has a problem with Jon specifically, he's choosing a passive way of dealing with that problem. He has not confronted Jon and said "Jon, I have a problem with the way you've decorated this room, as a cat I am colorblind and this sends me into a rage. You've created a rage room for me here and I don't like it, I want you to change it." Instead of that confrontational approach, though, Garfield has chosen to steal Jon's pipe. And that in turn angers Jon. But Jon decides to be aggressively angry and yell at Garfield, so now instead of a calm conversation between`,
	` two respectful parties, you have two heated, angry individuals, each with a problem and no direct line to solving it. The layered emotions here tell a story with tight, focused brevity that would make Hemingway weep. This is an entire drama in just 3 panels, people. But let's not be remiss and miss the humor of the situation, the... absurdity of it all. For certainly there is a reason the visual shorthand for drama includes both a crying mask and a laughing mask. Comedy and tragedy compliment each other and meld together to create drama. The tension, the height of humanity, the peak of art that reflects back to us our own condition. And here, in its basist form we can laugh at this comic, yes, comic! In which a cat smokes a pipe, heh! When was the last time you've seen such a thing in your life? Never, I presume. I certainly never have. The great Muse Thalia's presence is strong in this world of art here, comedy, it is comedy! And if you look at the structure again you'll see this perfect form of thirds works magically for`,
	` the transmission of yes, yes, a joke! The joke is as old as time. Even cavemen told jokes. And the joke here is that Jon... has lost his pipe, well he thinks he has. But lo and behold, it is the cat Garfield who has the pipe, surprise, surprise, the cat is smoking! Again the transition from setup to punchline takes place between the second and third panels. But make no mistake, the comic is more than just a comic. Yes it is funny, of course it is. It is operating at the hight of sophisticated humor on par with any of Shakespeare's piercing wit. On the one hand, Garfield the comic with Jon the man, humor as art. The other hand, Garfield comic with Jon the man, stirring, no, riveting drama! As with everything it is tension and release, tension, and release, a cycle. I keep returning to this idea because it is, it is so omnipresent, yes. You could and yes... I have done this on more then one occasion, you could print this comic strip on a giant piece of paper. The dimensions would be something like, 34 inches by 11 inches. Now`,
	` tape the ends together with the comic facing inward, stick your head in the middle of this Garfield comic loop and read, start at the first panel, Jon is reading the newspaper, he feels for something on the end table. Second panel, he sets the newspaper down, something is not right. "Now where could my pipe be," he thinks. And then the payoff, the third panel. Garfield has Jon's pipe and is smoking it. But ahaha! The paper is in a loop around your head so you can see that once again Jon is in his seat reading the paper, and so on and so on, you could literally read the comic strip for eternity! And spend many a relaxing Sunday afternoon reading this strip over and over. I'm reminded of the Portuguese death carvings with always begin and end with the same scrawled image. So this idea of repetition, of the beginning being the end, and the end being the beginning, it's not new. It is an ageless tradition among the best story tellers humanity has ever offered. And I'm not wrong to include cartoonist Jim Davis in that exalted set for this particular strip alone. I'm not foolish enough to deny that great art is subjective, divisive, even.`,
	` And that some people see this Garfield and shrug with no real reaction. But I will say that I believe everyone in the world should see it, at the very least, see it. You should all see it, read it. Spend some time with it. Spend an hour reading it. What's an hour? Yes, you could watch some television program, you could play some fast paced video games or computer games, yes, you could do all those things. But it's just an hour. And if you give this strip a chance, if you look into Jon Arbuckle's eyes, if you look into Jon Arbuckle's soul, you might find that you'll really be looking into your own soul. It's self discovery, that is what I'm talking about here. You have the opportunity, the possibility, it could change you. Don't be afraid. You know, just last week, I was eating lunch near the municipal court, like I do every Thursday and, there was a plumbing van, a plumbing van parked out in front, and a man, a plumber, would step out from the court and retrieve something from his van every so often. A few times this happened, I thought nothing of it, just a plumber doing some work at the municipal court. But then he came out and looked`,
	` through his van and it was clear, he couldn't find something. I noticed and thought, well, that's sort of similar to the Garfield comic in a way. Someone looks for something, can't find it. But yes, that probably happens billions of times a day around the world. But then this plumber put his hands on his hips, then he scratched his head and he said aloud "Now where could my pipe wrench be?" Huh! Well at this I leaped off the bench, sandwich still in hand and I rushed over, I shouted, "What was that you said?!" He looked at me and said "What? I can't find my pipe wrench." and I said "No, no no, say it like how you just said it." He scratched his head and repeated, "Now where could my pipe wrench be?" I slapped him on the back and said "Garfield!" He looked so confused so I said it again, then I said, "Your orange cat took it." Hehe, I laughed and laughed. He smiled and went back into the court room. I walked away knowing that the plumber and I, two complete strangers, bonded over this Garfield comic. You see life imitates art, and becomes a common ground. I have a feeling that if I see this plumber again we'll be sharing stories like two old friends.`,
	` Because we've been united by art, we have a common love for Jim Davis and his characters, his writings, the humor, the drama, the... that rascal Garfield the cat... Oh, and by the way, if you're wondering I was having for lunch that day it was a ham sandwich with an apple and potato chips, in a bag, I had a soda as well. I think it's important to view the pipe strip in philosophical terms. We've touched briefly on the notion of existentialism. That theme is very prevalent in this strip. Garfield is in fact a modern existential antihero. But if Garfield embodies the bewilderment in a meaningless life, what is Jon? What are the telltale signs that informs Jon's philosophical standpoint, his approach, what style of thinking he represents? Jon is depicted as being grounded in the material world, a world of things, he is surrounded by objects, and he touches these objects, he interacts with them. The newspaper, the end table, the chair, his clothes, all these physical things make up Jon's world.`,
	` In some sense, even his cat Garfield is an object to him, a thing. The first ideology that comes to mind that comes to mind when thinking of objects in the tangible world... is pragmatism. slur => slur)`,
].join('');

describe('Modlog conversion script', () => {
	describe('bracket parser', () => {
		it('should correctly parse parentheses', () => {
			assert.equal(converter.parseBrackets('(id)', '('), 'id');
		});

		it('should correctly parse square brackets', () => {
			assert.equal(converter.parseBrackets('[id]', '['), 'id');
		});

		it('should correctly parse the wrong type of bracket coming before', () => {
			assert.equal(converter.parseBrackets('(something) [id]', '['), 'id');
			assert.equal(converter.parseBrackets('[something] (id)', '('), 'id');
		});
	});

	describe('log modernizer', () => {
		it('should ignore logs that are already modernized', () => {
			const modernLogs = [
				'[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by annika',
				'[2020-08-23T19:45:24.326Z] (help-uwu) NOTE: by annika: j',
				'[2020-08-23T19:45:32.346Z] (battle-gen8randombattle-5348538495) NOTE: by annika: k',
				'[2020-08-23T19:48:14.823Z] (help-uwu) TICKETCLOSE: by annika',
				'[2020-08-23T19:48:14.823Z] (development) ROOMBAN: [sometroll] alts:[alt1], [alt2] ac:[autoconfirmed] [127.0.0.1] by annika: never uses the room for development',
				'[2018-01-18T14:30:02.564Z] (tournaments) TOUR CREATE: by ladymonita: gen7randombattle',
				`[2014-11-24T11:10:34.798Z] (lobby) NOTE: by joimnotesyakcity: lled by his friends`,
				`[2015-03-18T20:56:19.462Z] (lobby) WARN: [peterpablo] by xfix (Frost was banned for a reason - don't talk about Frost.)`,
				`[2015-10-23T19:13:58.190Z] (lobby) NOTE: by imas234: [2015-07-31 01:54pm] (lobby) Tru identity was locked from talking by Trickster. (bad Chingu)  uh....`,
				`[2015-11-27T12:26:15.741Z] (lobby) NOTE: by theraven: Arik Ex was banned under Eastglo`,
				`[2018-01-07T07:13:10.279Z] (lobby) NOTE: by gentlejellicent: Ah, you changed the staffintro to have bloodtext in it`,
				garfieldCopypasta,
			];
			for (const log of modernLogs) {
				assert.equal(converter.modernizeLog(log), log);
			}
		});

		it('should correctly parse old-format promotions and demotions', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [annika] was promoted to Voice by [heartofetheria].'),
				'[2020-08-23T19:50:49.944Z] (development) GLOBAL VOICE: [annika] by heartofetheria'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] was demoted to Room regular user by [heartofetheria].)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMREGULAR USER: [annika] by heartofetheria: (demote)'
			);
			assert.equal(
				converter.modernizeLog(`[2017-05-31T22:00:33.159Z] (espanol) vodsrtrainer MAR cos was demoted to Room regular user by [blazask].`),
				`[2017-05-31T22:00:33.159Z] (espanol) ROOMREGULAR USER: [vodsrtrainermarcos] by blazask: (demote)`
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] was demoted to Room Moderator by [heartofetheria].)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by heartofetheria: (demote)'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [annika] was appointed Room Owner by [heartofetheria].'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMOWNER: [annika] by heartofetheria'
			);
		});

		it('should correctly parse entries about modchat and modjoin', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] set modchat to autoconfirmed)'),
				'[2020-08-23T19:50:49.944Z] (development) MODCHAT: by annika: to autoconfirmed'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika set modjoin to +.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN: by annika: +'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika turned off modjoin.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN: by annika: OFF'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika set modjoin to sync.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN SYNC: by annika'
			);
		});

		it('should correctly parse modnotes', () => {
			assert.equal(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (development) ([annika] notes: I'm making a modnote)`),
				`[2020-08-23T19:50:49.944Z] (development) NOTE: by annika: I'm making a modnote`
			);
			assert.equal(
				converter.modernizeLog(`[2017-10-04T20:48:14.592Z] (bigbang) (Lionyx notes: test was banned by lionyx`),
				`[2017-10-04T20:48:14.592Z] (bigbang) NOTE: by lionyx: test was banned by lionyx`
			);
		});

		it('should correctly parse userids containing `notes`', () => {
			assert.equal(
				converter.modernizeLog(`[2014-11-24T11:10:34.798Z] (lobby) ([joimnotesyakcity] was trolled by his friends)`),
				`[2014-11-24T11:10:34.798Z] (lobby) [joimnotesyakcity] was trolled by his friends`
			);
		});

		it('should correctly parse roomintro and staffintro entries', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika changed the roomintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMINTRO: by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika changed the staffintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) STAFFINTRO: by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika deleted the roomintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) DELETEROOMINTRO: by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika deleted the staffintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) DELETESTAFFINTRO: by annika'
			);
		});

		it('should correctly parse room description changes', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] changed the roomdesc to: "a description".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMDESC: by annika: to "a description"'
			);
		});

		it('should correctly parse declarations', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika declared I am declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) DECLARE: by annika: I am declaring something'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika declared: I am declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) DECLARE: by annika: I am declaring something'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika globally declared (chat level) I am chat declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) CHATDECLARE: by annika: I am chat declaring something'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika globally declared I am globally declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) GLOBALDECLARE: by annika: I am globally declaring something'
			);
		});

		it('should correctly parse entries about roomevents', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika edited the roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: edited "Writing Unit Tests"'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika removed a roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: removed "Writing Unit Tests"'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika added a roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: added "Writing Unit Tests"'
			);
		});

		it('should correctly parse old-format tournament modlogs', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) ([annika] created a tournament in randombattle format.)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR CREATE: by annika: randombattle'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) ([heartofetheria] was disqualified from the tournament by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR DQ: [heartofetheria] by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) (The tournament auto disqualify timeout was set to 2 by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR AUTODQ: by annika: 2'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) (The tournament auto disqualify timer was set to 2 by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR AUTODQ: by annika: 2'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) (The tournament auto start timer was set to 2 by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR AUTOSTART: by annika: 2'
			);
			assert.equal(
				converter.modernizeLog(`[2017-04-23T05:58:24.988Z] (development) (Lady Monita set the tournament's banlist to Leppa Berry.)`),
				`[2017-04-23T05:58:24.988Z] (development) TOUR BANLIST: by ladymonita: Leppa Berry`
			);
			assert.equal(
				converter.modernizeLog(`[2017-12-06T18:58:01.953Z] (development) (Hydreigon Specs set the tournament's custom rules to +Landorus, +Zeraora.)`),
				`[2017-12-06T18:58:01.953Z] (development) TOUR RULES: by hydreigonspecs: +Landorus, +Zeraora`
			);
			assert.equal(
				converter.modernizeLog(`[2017-12-06T18:58:01.953Z] (development) (Hydreigon Specs set the tournament's custom rules to +Landorus, +Zeraora.)`),
				`[2017-12-06T18:58:01.953Z] (development) TOUR RULES: by hydreigonspecs: +Landorus, +Zeraora`
			);
			assert.equal(
				converter.modernizeLog(`[2017-06-22T16:35:33.414Z] (development) ([thetournament] was set to autostart when the player cap is reached by Lady Monita)`),
				`[2017-06-22T16:35:33.414Z] (development) TOUR AUTOSTART: by ladymonita: when playercap is reached`
			);
			assert.equal(
				converter.modernizeLog(`[2015-09-19T13:30:44.740Z] (development) ([thetournament] was set to disallow scouting by SparksBlade)`),
				`[2015-09-19T13:30:44.740Z] (development) TOUR SCOUT: by sparksblade: disallow`
			);
			assert.equal(
				converter.modernizeLog(`[2015-09-19T13:30:44.740Z] (development) ([thetournament] was set to allow scouting by SparksBlade)`),
				`[2015-09-19T13:30:44.740Z] (development) TOUR SCOUT: by sparksblade: allow`
			);
		});

		it('should correctly parse old-format roombans', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] by annika: reason'
			);
			assert.equal(
				converter.modernizeLog(`[2015-06-07T13:44:30.057Z] (shituusers) ROOMBAN: [eyan] (You have been kicked by +Cynd(~'e')~quil. Reason: Undefined) by shituubot`),
				`[2015-06-07T13:44:30.057Z] (shituusers) ROOMBAN: [eyan] by shituubot: You have been kicked by +Cynd(~'e')~quil. Reason: Undefined`
			);
		});

		it('should correctly parse old-format blacklists', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was blacklisted from Development by Annika.'),
				'[2020-08-23T19:50:49.944Z] (development) BLACKLIST: [heartofetheria] by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was blacklisted from Development by Annika. (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) BLACKLIST: [heartofetheria] by annika: reason'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was nameblacklisted from Development by Annika.'),
				'[2020-08-23T19:50:49.944Z] (development) NAMEBLACKLIST: [heartofetheria] by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was nameblacklisted from Development by Annika. (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) NAMEBLACKLIST: [heartofetheria] by annika: reason'
			);
		});

		it('should correctly parse old-format mutes', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was muted by annikafor1hour (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) HOURMUTE: [heartofetheria] by annika: reason'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) heartofetheria was muted by Annika for 1 hour (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) HOURMUTE: [heartofetheria] by annika: reason'
			);
			assert.equal(
				converter.modernizeLog('[2016-09-27T18:25:55.574Z] (swag) harembe⚠ was muted by rubyfor1hour (harembe was promoted to ! by ruby.)'),
				'[2016-09-27T18:25:55.574Z] (swag) HOURMUTE: [harembe] by ruby: harembe was promoted to ! by ruby.'
			);
		});

		it('should correctly parse old-format weeklocks', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) heartofetheria was locked from talking for a week by annika (reason) [IP]'),
				'[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [heartofetheria] [IP] by annika: reason'
			);
		});

		it('should correctly parse old-format global bans', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned by annika (reason) [IP]'),
				'[2020-08-23T19:50:49.944Z] (development) BAN: [heartofetheria] [IP] by annika: reason'
			);
		});

		it('should correctly parse alts using nextLine', () => {
			assert.equal(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) heartofetheria was locked from talking for a week by annika (reason)',
					`[2020-08-23T19:50:49.944Z] (development) ([heartofetheria]'s locked alts: [annika0], [hordeprime])`
				),
				'[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [heartofetheria] alts: [annika0], [hordeprime] by annika: reason'
			);

			assert.equal(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) heartofetheria was locked from talking for a week by annika (reason)',
					`[2020-08-23T19:50:49.944Z] (development) (Heart of Etheria's locked alts: annika0, hordeprime)`
				),
				'[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [heartofetheria] alts: [annika0], [hordeprime] by annika: reason'
			);

			assert.equal(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika',
					`[2020-08-23T19:50:49.944Z] (development) ([heartofetheria]'s banned alts: [annika0], [hordeprime])`
				),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] alts: [annika0], [hordeprime] by annika'
			);

			assert.equal(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was blacklisted from Development by Annika.',
					`[2020-08-23T19:50:49.944Z] (development) ([heartofetheria]'s blacklisted alts: [annika0], [hordeprime])`
				),
				'[2020-08-23T19:50:49.944Z] (development) BLACKLIST: [heartofetheria] alts: [annika0], [hordeprime] by annika'
			);
		});

		it('should correctly parse autoconfirmed alts using nextLine', () => {
			assert.equal(
				converter.modernizeLog(
					`[2018-01-18T05:40:14.323Z] (lobby) [cartmanqueen] was muted by GeoffBruedly for 1 hour.`,
					`[2018-01-18T05:40:14.324Z] (lobby) (Cartman(Queen)'s ac account: cartmanxjews)`
				),
				'[2018-01-18T05:40:14.323Z] (lobby) HOURMUTE: [cartmanqueen] ac: [cartmanxjews] by geoffbruedly'
			);
		});

		it('should correctly parse poll modlogs', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([apoll] was started by [annika].)',),
				'[2020-08-23T19:50:49.944Z] (development) POLL: by annika'
			);

			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([thepoll] was ended by [annika].)',),
				'[2020-08-23T19:50:49.944Z] (development) POLL END: by annika'
			);
		});

		it('should correctly parse Trivia modlogs', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (trivia) (User annika won the game of Triumvirate mode trivia under the All category with a cap of 50 points, with 50 points and 10 correct answers! Second place: heartofetheria (10 points), third place: hordeprime (5 points))'),
				'[2020-08-23T19:50:49.944Z] (trivia) TRIVIAGAME: by unknown: User annika won the game of Triumvirate mode trivia under the All category with a cap of 50 points, with 50 points and 10 correct answers! Second place: heartofetheria (10 points), third place: hordeprime (5 points)'
			);
		});

		it('should handle claiming helptickets', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika claimed this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is now claimed by Annika.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is now claimed by [annika]'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
		});

		it('should handle closing helptickets', () => {
			// Abandonment
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is no longer claimed.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETUNCLAIM'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Heart of Etheria is no longer interested in this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETABANDON: by heartofetheria'
			);

			// Closing
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika closed this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLOSE: by annika'
			);

			// Deletion
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika deleted this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETDELETE: by annika'
			);
		});

		it('should handle opening helptickets', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Heart of Etheria opened a new ticket. Issue: Being trapped in a unit test factory'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETOPEN: by heartofetheria: Being trapped in a unit test factory'
			);
		});

		it('should handle Scavengers modlogs', () => {
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETHOSTPOINTS: [room: subroom] by annika: 42'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETHOSTPOINTS: by annika: 42 [room: subroom]'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV TWIST: [room: subroom] by annika: your mom'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV TWIST: by annika: your mom [room: subroom]'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETPOINTS: [room: subroom] by annika: ååååååå'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETPOINTS: by annika: ååååååå [room: subroom]'
			);
			assert.equal(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) ([annika] has been caught attempting a hunt with 2 connections on the account. The user has also been given 1 infraction point on the player leaderboard.)'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV CHEATER: [annika]: caught attempting a hunt with 2 connections on the account; has also been given 1 infraction point on the player leaderboard'
			);
			// No moderator actions containing has been caught trying to do their own hunt found on room scavengers.
			// Apparently this never got written to main's modlog, so I am not going to write a special test case
			// and converter logic for it.
		});

		it('should handle Wi-Fi modlogs', () => {
			assert.equal(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (wifi) GIVEAWAY WIN: Annika won Heart of Etheria's giveaway for a "deluxe shitposter 1000" (OT: Entrapta TID: 1337)`),
				`[2020-08-23T19:50:49.944Z] (wifi) GIVEAWAY WIN: [annika]: Heart of Etheria's giveaway for a "deluxe shitposter 1000" (OT: Entrapta TID: 1337)`
			);
			assert.equal(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (wifi) GTS FINISHED: Annika has finished their GTS giveaway for "deluxe shitposter 2000"`),
				`[2020-08-23T19:50:49.944Z] (wifi) GTS FINISHED: [annika]: their GTS giveaway for "deluxe shitposter 2000"`
			);
		});

		it('should handle global declarations mentioning promotions correctly', () => {
			assert.equal(
				converter.modernizeLog(`[2015-07-21T06:04:54.369Z] (lobby) xfix declared GrumpyGungan was promoted to a global voice, feel free to congratulate him :-).`),
				`[2015-07-21T06:04:54.369Z] (lobby) DECLARE: by xfix: GrumpyGungan was promoted to a global voice, feel free to congratulate him :-).`
			);
		});

		it('should handle hangman and UNO games', () => {
			assert.equal(
				converter.modernizeLog(`[2016-09-22T19:07:35.411Z] (development) ([agameofhangman] was started by [br3to].)`),
				`[2016-09-22T19:07:35.411Z] (development) HANGMAN: by br3to`
			);
			assert.equal(
				converter.modernizeLog(`[2017-05-07T18:34:40.730Z] (development) ([agameofunowas] created by [jinkazaragi].)`),
				`[2017-05-07T18:34:40.730Z] (development) UNO CREATE: by jinkazaragi`
			);
		});
	});

	describe('text entry to ModlogEntry converter', () => {
		it('should correctly parse modernized promotions and demotions', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by heartofetheria`),
				{
					action: 'ROOMMODERATOR', roomID: 'development', userid: 'annika',
					isGlobal: false, loggedBy: 'heartofetheria', time: 1598212249944,
					alts: [], autoconfirmedID: null, ip: null, note: '', visualRoomID: '',
				}
			);

			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) ROOMVOICE: [annika] by heartofetheria: (demote)`),
				{
					action: 'ROOMVOICE', roomID: 'development', userid: 'annika',
					isGlobal: false, loggedBy: 'heartofetheria', note: '(demote)', time: 1598212249944,
					alts: [], autoconfirmedID: null, ip: null, visualRoomID: '',
				}
			);
		});

		it('should not mess up HIDEALTSTEXT', () => {
			// HIDEALTSTEXT apparently was causing bugs
			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) HIDEALTSTEXT: [auser] alts:[alt1] by annika: hnr`),
				{
					action: 'HIDEALTSTEXT', roomID: 'development', userid: 'auser', alts: ['alt1'],
					note: 'hnr', isGlobal: false, loggedBy: 'annika', time: 1598212249944,
					autoconfirmedID: null, ip: null, visualRoomID: '',
				}
			);
		});

		it('should correctly parse modernized punishments, including alts/IP/autoconfirmed', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] ac: [annika] alts: [annalytically], [heartofetheria] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', autoconfirmedID: 'annika', alts: ['annalytically', 'heartofetheria'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944, visualRoomID: '',
				}
			);
			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] ac:[annika] alts:[annalytically], [heartofetheria] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', autoconfirmedID: 'annika', alts: ['annalytically', 'heartofetheria'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944, visualRoomID: '',
				}
			);


			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] alts:[annalytically] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', alts: ['annalytically'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
					autoconfirmedID: null, visualRoomID: '',
				}
			);

			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg',
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
					alts: [], autoconfirmedID: null, visualRoomID: '',
				}
			);
		});

		it('should correctly parse modnotes', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) NOTE: by annika: HELP! I'm trapped in a unit test factory...`),
				{
					action: 'NOTE', roomID: 'development', isGlobal: false, loggedBy: 'annika',
					note: `HELP! I'm trapped in a unit test factory...`, time: 1598212249944,
					alts: [], autoconfirmedID: null, ip: null, userid: null, visualRoomID: '',
				}
			);
		});

		it('should correctly parse visual roomids', () => {
			const withVisualID = converter.parseModlog(`[time] (battle-gen7randombattle-1 tournament: development) SOMETHINGBORING: by annika`);
			assert.equal(withVisualID.visualRoomID, 'battle-gen7randombattle-1 tournament: development');
			assert.equal(withVisualID.roomID, 'battle-gen7randombattle-1');

			const noVisualID = converter.parseModlog(`[time] (battle-gen7randombattle-1) SOMETHINGBORING: by annika`);
			assert.equal(noVisualID.visualRoomID, '');
		});

		it('should properly handle OLD MODLOG', () => {
			assert.deepEqual(
				converter.parseModlog(`[2014-11-20T13:46:00.288Z] (lobby) OLD MODLOG: by unknown: [punchoface] would be muted by [thecaptain] but was already muted.)`),
				{
					action: 'OLD MODLOG', roomID: 'lobby', isGlobal: false, loggedBy: 'unknown',
					note: `[punchoface] would be muted by [thecaptain] but was already muted.)`, time: 1416491160288,
					alts: [], autoconfirmedID: null, ip: null, userid: null, visualRoomID: '',
				}
			);
		});

		it('should correctly handle hangman', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-09-19T23:25:24.908Z] (lobby) HANGMAN: by archastl`),
				{
					action: 'HANGMAN', roomID: 'lobby', isGlobal: false, loggedBy: 'archastl', time: 1600557924908,
					alts: [], autoconfirmedID: null, ip: null, note: '', userid: null, visualRoomID: '',
				}
			);
		});

		it('should correctly handle nonstandard alt formats', () => {
			assert.deepEqual(
				converter.parseModlog(
					`[2018-01-18T19:47:11.404Z] (battle-gen7randombattle-690788015) AUTOLOCK: [trreckko] alts:[MasterOP13, [luckyfella], Derp11223, [askul], vfffgcfvgvfghj, trreckko, MrShnugglebear] [127.0.0.1]: Pornhub__.__com/killyourself`
				).alts,
				['masterop13', 'luckyfella', 'derp11223', 'askul', 'vfffgcfvgvfghj', 'trreckko', 'mrshnugglebear']
			);

			assert.deepEqual(
				converter.parseModlog(
					`[2018-01-20T10:19:19.763Z] (battle-gen7randombattle-691544312) AUTOLOCK: [zilgo] alts:[[ghjkjguygjbjb], zilgo] [127.0.0.1]: www__.__pornhub__.__com`
				).alts,
				['ghjkjguygjbjb', 'zilgo']
			);
		});

		it('should correctly handle modlog entries with an IP but no userid', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-09-30T20:02:12.456Z] (lobby) SHAREDIP: [127.0.0.1] by annika: j`),
				{
					action: 'SHAREDIP', roomID: 'lobby', isGlobal: false, loggedBy: 'annika',
					note: `j`, time: 1601496132456, ip: "127.0.0.1", alts: [], autoconfirmedID: null,
					userid: null, visualRoomID: '',
				}
			);
			assert.deepEqual(
				converter.parseModlog(`[2020-09-30T20:02:12.456Z] (lobby) UNSHAREDIP: [127.0.0.1] by annika`),
				{
					action: 'UNSHAREDIP', roomID: 'lobby', isGlobal: false, loggedBy: 'annika', time: 1601496132456, ip: "127.0.0.1",
					alts: [], autoconfirmedID: null, note: '', userid: null, visualRoomID: '',
				}
			);
		});

		it('should correctly handle trivia', () => {
			assert.deepEqual(
				converter.parseModlog(`[2020-09-19T23:25:24.908Z] (trivia) TRIVIAGAME: by snowjy: User one for my baby won the game of Timer mode trivia under the Sub-Category 2 category with no score cap, with 69 points and 19 correct answers Second place: Mystiphox (45 points), third place: Mukund (41 points)`),
				{
					action: 'TRIVIAGAME', roomID: 'trivia', isGlobal: false, loggedBy: 'snowjy', time: 1600557924908,
					alts: [], autoconfirmedID: null, ip: null, note: 'User one for my baby won the game of Timer mode trivia under the Sub-Category 2 category with no score cap, with 69 points and 19 correct answers Second place: Mystiphox (45 points), third place: Mukund (41 points)', userid: null, visualRoomID: '',
				}
			);
		});
	});

	describe('ModlogEntry to text converter', () => {
		it('should handle all fields of the ModlogEntry object', () => {
			const entry = {
				action: 'UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: false,
				loggedBy: 'yourmom',
				note: 'Hey Adora~',
				time: 1598212249944,
			};
			assert.equal(
				converter.rawifyLog(entry),
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Hey Adora~\n`
			);
		});

		it('should handle OLD MODLOG', () => {
			assert.deepEqual(
				converter.rawifyLog({
					action: 'OLD MODLOG', roomID: 'development', isGlobal: false, loggedBy: 'unknown',
					note: `hello hi test`, time: 1598212249944, alts: [],
				}),
				`[2020-08-23T19:50:49.944Z] (development) OLD MODLOG: by unknown: hello hi test\n`,
			);
		});

		it('should handle hangman', () => {
			assert.deepEqual(
				converter.rawifyLog({action: 'HANGMAN', roomID: 'lobby', isGlobal: false, loggedBy: 'archastl', time: 1600557924908, alts: []}),
				`[2020-09-19T23:25:24.908Z] (lobby) HANGMAN: by archastl\n`
			);
		});
	});

	describe('reversability', () => {
		it('should be reversible', () => {
			const tests = [
				`[2020-08-23T19:50:49.944Z] (development) OLD MODLOG: by unknown: hello hi test`,
				`[2014-11-20T13:46:00.288Z] (lobby) OLD MODLOG: by unknown: [punchoface] would be muted by [thecaptain] but was already muted.)`,
				`[2017-04-20T18:20:42.408Z] (1v1) OLD MODLOG: by unknown: The tournament auto disqualify timer was set to 2 by Scrappie`,
				`[2020-09-19T23:28:49.309Z] (lobby) HANGMAN: by archastl`,
				`[2020-09-20T22:57:27.263Z] (lobby) NOTIFYRANK: by officerjenny: %, You are the last staff left in lobby.`,
				`[2020-08-12T00:23:49.183Z] (lobby) MUTE: [hypergigahax] [127.0.0.1]: please only speak english. Checking your modlog you should have understood the rules`,
				`[2020-09-07T02:17:22.132Z] (lobby) ROOMBAN: [gamingisawesome] [127.0.0.1] by tenshi: wow this is the most written by a 10 year old sentence I've read in a long time`,
				`[2017-10-04T20:48:14.592Z] (bigbang) NOTE: by lionyx: test was banned by lionyx`,
				`[2018-01-18T18:09:49.765Z] (global) NAMELOCK: [guest130921] alts: [guest130921]: [127.0.0.1] NameMonitor: vvvv.xxx`,
				`[2018-01-19T01:12:30.660Z] (wifi) GIVEAWAY WIN: [ikehylt]: rareassassin90's giveaway for "(Previously won from another giveaway)  Paradise the Shiny VC Ho-Oh - Poké Ball - Adamant - Regenerator - (31/31/31/30/31/31) Proof: https://imgur.com/a/5enjr, move list: nightmare, curse zap cannon, dragon breath" (OT: Kaushik TID: 00001 FC: 0276-3231-6110)`,
				`[2018-02-12T23:44:16.498Z] (wifi) GTS FINISHED: [throwingstar]: their GTS giveaway for "Heracross - Adamant - Guts - '' Battle ready '' - 31/31/31/x/31/31 - 248Hp/252atk/8SpDef - [[item: beast ball]] - It's holding a [[item: flame orb]] because [[item: heracronite]] won't pass through GTS - OT TSK, 479870"`,
				`[2016-03-09T02:39:04.064Z] (groupchat-arandomduck-becausememes) ROOMBAN: [theeaglesarecoming] by arandomduck: (A game of hangman was started  WORST FUCKIN MOD/DRIVER ON THIS SERVER SLKDJFS)`,
				garfieldCopypasta,
			];
			for (const test of tests) {
				assert.equal(test, converter.rawifyLog(converter.parseModlog(test)).replace('\n', ''));
			}
		});

		it('multiline entries should be reversible', () => {
			const originalConvert = converter.rawifyLog(converter.parseModlog(
				`[2014-11-20T16:30:17.661Z] (lobby) LOCK: [violight] (spamming) by joim`,
				`[2014-11-20T16:30:17.673Z] (lobby) (violight's ac account: violight)`
			)).replace('\n', '');
			assert.equal(originalConvert, converter.rawifyLog(converter.parseModlog(originalConvert)).replace('\n', ''));
		});
	});

	describe.skip('integration tests', () => {
		it('should convert from SQLite to text', async () => {
			const modlog = new ml.Modlog('/dev/null', ':memory:', true);
			const mlConverter = new converter.ModlogConverterSQLite('', '', modlog.database);

			modlog.initialize('development');

			const entry = {
				action: 'UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: false,
				loggedBy: 'yourmom',
				note: 'Write 1',
				time: 1598212249944,
			};
			modlog.write('development', entry);
			entry.time++;
			entry.note = 'Write 2';
			modlog.write('development', entry);
			entry.time++;
			entry.note = 'Write 3';
			modlog.write('development', entry);
			modlog.write('development', {
				action: 'GLOBAL UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: true,
				loggedBy: 'yourmom',
				note: 'Global test',
				time: 1598212249947,
			});

			await mlConverter.toTxt();
			assert.equal(
				mlConverter.isTesting.files.get('/modlog_development.txt'),
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 1\n` +
				`[2020-08-23T19:50:49.945Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 2\n` +
				`[2020-08-23T19:50:49.946Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 3\n` +
				`[2020-08-23T19:50:49.947Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global test\n`
			);

			assert.equal(
				mlConverter.isTesting.files.get('/modlog_global.txt'),
				`[2020-08-23T19:50:49.947Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global test\n`
			);
		});

		it('should convert from text to SQLite, including old-format lines and nonsense lines', async () => {
			const lines = [
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 1`,
				`[2020-08-23T19:50:49.945Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global Write`,
				`[2020-08-23T19:50:49.946Z] (development tournament: lobby) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 3`,
			];
			const globalLines = [
				`[2020-08-23T19:50:49.945Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global Write`,
			];
			const mlConverter = new converter.ModlogConverterTxt('', '', new Map([
				['modlog_development.txt', lines.join('\n')],
				['modlog_global.txt', globalLines.join('\n')],
			]));

			const database = await mlConverter.toSQLite();
			const globalEntries = database
				.prepare(`SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts FROM modlog WHERE is_global = 1'`)
				.all();
			const entries = database
				.prepare(`SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts FROM modlog WHERE roomid IN (?, ?) ORDER BY timestamp ASC`)
				.all('development', 'trivia');

			assert.equal(globalEntries.length, globalLines.length);
			assert.equal(entries.length, lines.length);

			const visualIDEntry = entries[entries.length - 1];

			assert.equal(visualIDEntry.note, 'Write 3');
			assert.equal(visualIDEntry.visual_roomid, 'development tournament: lobby');
			assert(!globalEntries[0].visual_roomid);

			assert.equal(globalEntries[0].timestamp, 1598212249945);
			assert.equal(globalEntries[0].roomid, 'development');
			assert.equal(globalEntries[0].action, 'GLOBAL UNITTEST');
			assert.equal(globalEntries[0].action_taker_userid, 'yourmom');
			assert.equal(globalEntries[0].userid, 'annika');
			assert.equal(globalEntries[0].autoconfirmed_userid, 'heartofetheria');
			assert.equal(globalEntries[0].ip, '127.0.0.1');
			assert.equal(globalEntries[0].note, 'Global Write');
			assert.equal(globalEntries[0].alts, 'googlegoddess,princessentrapta');
		});
	});
});
