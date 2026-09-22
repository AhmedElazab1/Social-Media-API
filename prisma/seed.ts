import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import {
  NotificationType,
  ReactionType,
  PrismaClient,
} from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const users = [
  {
    email: 'ahmed@example.com',
    username: 'ahmed',
    firstName: 'Ahmed',
    lastName: 'Elazab',
  },
  {
    email: 'mohamed@example.com',
    username: 'mohamed',
    firstName: 'Mohamed',
    lastName: 'Ali',
  },
  {
    email: 'omar@example.com',
    username: 'omar',
    firstName: 'Omar',
    lastName: 'Hassan',
  },
  {
    email: 'youssef@example.com',
    username: 'youssef',
    firstName: 'Youssef',
    lastName: 'Mahmoud',
  },
  {
    email: 'sara@example.com',
    username: 'sara',
    firstName: 'Sara',
    lastName: 'Ahmed',
  },
];

const postContents = [
  'Learning NestJS and building a clean backend architecture.',
  'Today I learned something new about Prisma.',
  'Working on my Social Media API project.',
  'Backend development is all about good architecture.',
  'Testing pagination and sorting with mock data.',
  'Building REST APIs with NestJS is fun.',
  'Another productive day of coding.',
  'Learning more about PostgreSQL and Prisma.',
  'Working on authentication and authorization.',
  'Clean code makes backend projects easier to maintain.',
];

const commentContents = [
  'Great post!',
  'This is really useful.',
  'Thanks for sharing!',
  'I totally agree.',
  'Nice work!',
  'This helped me understand the topic better.',
  'Interesting idea.',
  'Keep going!',
  'Very informative.',
  'I learned something new from this.',
];

const mediaUrls = [
  'https://example.com/image-1.jpg',
  'https://example.com/image-2.jpg',
  'https://example.com/image-3.jpg',
  'https://example.com/image-4.jpg',
];

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash('Seed12345!', 12);

  // --------------------------------------------------
  // Users
  // --------------------------------------------------

  const createdUsers = [];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: {
        email: user.email,
      },

      update: {
        passwordHash,
      },

      create: {
        ...user,
        passwordHash,
      },
    });

    createdUsers.push(createdUser);
  }

  console.log(`✅ Created/found ${createdUsers.length} users`);

  // --------------------------------------------------
  // Posts + Media
  // --------------------------------------------------

  const createdPosts: Awaited<ReturnType<typeof prisma.post.create>>[] = [];

  for (let i = 0; i < 50; i++) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    const hasContent = Math.random() > 0.2;
    const hasMedia = Math.random() > 0.5;

    const post = await prisma.post.create({
      data: {
        id: randomUUID(),

        content: hasContent
          ? postContents[Math.floor(Math.random() * postContents.length)]
          : null,

        authorId: user.id,

        mediaFiles: hasMedia
          ? {
              create: Array.from(
                {
                  length: Math.floor(Math.random() * 3) + 1,
                },
                () => ({
                  url: mediaUrls[Math.floor(Math.random() * mediaUrls.length)],
                  type: 'image/jpeg',
                }),
              ),
            }
          : undefined,
      },
    });

    createdPosts.push(post);

    if (i % 10 === 0) {
      await prisma.post.update({
        where: {
          id: post.id,
        },

        data: {
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log(`✅ Created ${createdPosts.length} posts`);

  // --------------------------------------------------
  // Soft-delete some posts
  // --------------------------------------------------

  const postsToDelete = await prisma.post.findMany({
    take: 3,

    orderBy: {
      createdAt: 'asc',
    },

    select: {
      id: true,
    },
  });

  await prisma.post.updateMany({
    where: {
      id: {
        in: postsToDelete.map((post) => post.id),
      },
    },

    data: {
      deletedAt: new Date(),
    },
  });

  console.log(`🗑️ Soft-deleted ${postsToDelete.length} posts`);

  // Get only active posts.
  // We use the database result because the objects inside
  // createdPosts are not automatically updated after updateMany.
  const activePosts = await prisma.post.findMany({
    where: {
      id: {
        in: createdPosts.map((post) => post.id),
      },
      deletedAt: null,
    },

    select: {
      id: true,
      authorId: true,
    },
  });

  // --------------------------------------------------
  // Comments
  // --------------------------------------------------

  const createdComments: Awaited<ReturnType<typeof prisma.comment.create>>[] =
    [];

  for (let i = 0; i < 80; i++) {
    const post = activePosts[Math.floor(Math.random() * activePosts.length)];

    const author =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];

    const comment = await prisma.comment.create({
      data: {
        content:
          commentContents[Math.floor(Math.random() * commentContents.length)],

        authorId: author.id,
        postId: post.id,
      },
    });

    createdComments.push(comment);
  }

  console.log(`✅ Created ${createdComments.length} comments`);

  // Soft-delete a few comments so the seed contains both
  // active and deleted comments.
  const commentsToDelete = createdComments.slice(0, 3);

  await prisma.comment.updateMany({
    where: {
      id: {
        in: commentsToDelete.map((comment) => comment.id),
      },
    },

    data: {
      deletedAt: new Date(),
    },
  });

  console.log(`🗑️ Soft-deleted ${commentsToDelete.length} comments`);

  // Get active comments for reactions.
  const activeComments = await prisma.comment.findMany({
    where: {
      id: {
        in: createdComments.map((comment) => comment.id),
      },
      deletedAt: null,
    },

    select: {
      id: true,
    },
  });

  // --------------------------------------------------
  // Likes / Reactions on Posts
  // --------------------------------------------------

  let createdPostLikes = 0;

  for (const post of activePosts) {
    const numberOfLikes = Math.floor(Math.random() * createdUsers.length) + 1;

    for (let i = 0; i < numberOfLikes; i++) {
      const user = createdUsers[i];

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,

          type: Object.values(ReactionType)[
            Math.floor(Math.random() * Object.values(ReactionType).length)
          ],
        },
      });

      createdPostLikes++;
    }
  }

  console.log(`❤️ Created ${createdPostLikes} post reactions`);

  // --------------------------------------------------
  // Likes / Reactions on Comments
  // --------------------------------------------------

  let createdCommentLikes = 0;

  for (const comment of activeComments) {
    const numberOfLikes = Math.floor(Math.random() * createdUsers.length);

    for (let i = 0; i < numberOfLikes; i++) {
      const user = createdUsers[i];

      await prisma.like.create({
        data: {
          userId: user.id,
          commentId: comment.id,

          type: Object.values(ReactionType)[
            Math.floor(Math.random() * Object.values(ReactionType).length)
          ],
        },
      });

      createdCommentLikes++;
    }
  }

  console.log(`❤️ Created ${createdCommentLikes} comment reactions`);

  // --------------------------------------------------
  // Follows
  // --------------------------------------------------

  let createdFollows = 0;
  let deactivatedFollows = 0;

  for (const follower of createdUsers) {
    for (const following of createdUsers) {
      if (follower.id === following.id) {
        continue;
      }

      const follow = await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: following.id,
        },
      });

      createdFollows++;

      // Make some relationships inactive so we can test
      // unfollowedAt filtering.
      if (createdFollows % 5 === 0) {
        await prisma.follow.update({
          where: {
            id: follow.id,
          },

          data: {
            unfollowedAt: new Date(),
          },
        });

        deactivatedFollows++;
      }
    }
  }

  console.log(`👥 Created ${createdFollows} follows`);
  console.log(`↩️ Deactivated ${deactivatedFollows} follows`);

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  const notificationTypes = [
    NotificationType.LIKE,
    NotificationType.COMMENT,
    NotificationType.FOLLOW,
    NotificationType.MENTION,
  ];

  const notificationMessages = {
    [NotificationType.LIKE]: 'liked your post.',
    [NotificationType.COMMENT]: 'commented on your post.',
    [NotificationType.FOLLOW]: 'started following you.',
    [NotificationType.MENTION]: 'mentioned you in a post.',
  };

  let createdNotifications = 0;

  for (let i = 0; i < 40; i++) {
    const recipient =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];

    let actor = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    // Avoid self-notifications when possible.
    if (actor.id === recipient.id) {
      actor =
        createdUsers[(createdUsers.indexOf(actor) + 1) % createdUsers.length];
    }

    const type =
      notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

    await prisma.notification.create({
      data: {
        type,
        message: `${actor.username} ${notificationMessages[type]}`,
        recipientId: recipient.id,
        actorId: actor.id,

        isRead: Math.random() > 0.5,
      },
    });

    createdNotifications++;
  }

  console.log(`🔔 Created ${createdNotifications} notifications`);

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
