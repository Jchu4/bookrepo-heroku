INSERT INTO users (user_name, email, created_at)
VALUES 
  ('James', 'james@test.com', '2021-02-26 23:13:09.390214+08'),
  ('Peter', 'peter@test.com', '2021-02-26 23:11:35.476832+08'),
  ('Jerome', 'jerome@test.com', '2021-02-25 22:52:22.305566+08');


INSERT INTO collection (user_id, book_id, user_cover, num_pages, pages_completed, date_added, date_completed)
VALUES 
  (1, 12, '', 157, 110, '2018-02-03', 'infinity'),
  (1, 13, '', 112, 112, '2020-11-15', '2021-01-15'),
  (2, 5, '', 253, 92, '2019-10-10', 'infinity'),
  (2, 7, '', 336, 38, '2020-12-30', 'infinity'),
  (2, 10 ,'', 681, 19, '2021-02-18', 'infinity'),
  (3, 1, '', 368, 92, '2020-01-03', 'infinity'),
  (3, 3, '', 291, 78, '2020-11-15', 'infinity'),
  (3, 5, '', 253, 152, '2019-12-10', 'infinity'),
  (3, 6, '', 264, 264, '2019-08-10', '2019-12-15');


INSERT INTO notes (user_id, description, book_id, private, date)
VALUES 
  (1, 'Everyone individual has thier own journey, there is no silver bullet answer to move forward.', 13, 'false', '2020-12-02'),
  (1, 'If unregenerated, it is just impossible', 12, 'true', '2019-11-12'),
  (2, 'Retrieval - recalling what you’ve learnt through thinking about it', 5, 'false', '2019-12-12'),
  (2, 'Generation - basically the feynman technique, and also thinking about how you could do things differently', 5, 'false', '2019-12-12'),
  (2, 'Eleboration - connecting what you learnt to something you already know and understand', 5, 'false', '2019-12-12'),
  (2, 'Did not know Snowden could write so well..', 7, 'true', '2020-12-30'),
  (2, 'Blibliotherapy: reading books as a form of therapy. Amazing.', 10, 'true', '2021-02-20'),
  (3, 'Federer Vs Woods, the story of a generalist before specialising and a speciliaser since young.', 3, 'false', '2020-11-18'),
  (3, 'Interleaving forces one to be on ones toes leaving room for imagination of different scenarios.', 5, 'false', '2020-01-18'),
  (3, 'Chain your desired habits to pre-existing ones.', 6, 'true', '2019-09-21');


INSERT INTO books (book_cover, title, description)
VALUES 
  ('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/12_Rules_for_Life_Front_Cover_%282018_first_edition%29.jpg/800px-12_Rules_for_Life_Front_Cover_%282018_first_edition%29.jpg', '12 Rules For Life: An Antidote to Chaos', 'In this book, Jordan B. Peterson provides twelve profound and practical principles for how to live a meaningful life, from setting your house in order before criticising others to comparing yourself to who you were yesterday, not someone else today. Happiness is a pointless goal, he shows us. Instead we must search for meaning, not for its own sake, but as a defence against the suffering that is intrinsic to our existence.
'), -- 1
  ('https://m.media-amazon.com/images/I/41L+pdZ14CL.jpg', 'World Order', 'World Order is the summation of Henry Kissingers thinking about history, strategy and statecraft. As if taking a perspective from far above the globe, it examines the great tectonic plates of history and the motivations of nations, explaining the attitudes that states and empires have taken to the rest of the world from the formation of Europe to our own times.
'), -- 2
  ('https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1545128068l/43260847._SY475_.jpg', 'Range', 'In this landmark book, David Epstein shows you that the way to succeed is by sampling widely, gaining a breadth of experiences, taking detours, experimenting relentlessly, juggling many interests - in other words, by developing range.
'),-- 3
  ('https://images-na.ssl-images-amazon.com/images/I/513Z9RAXGNL.jpg', 'Focus', 'For more than two decades, psychologist and journalist Daniel Goleman has been scouting the leading edge of the human sciences for whats new, surprising, and important. In Focus, he delves into the science of attention in all its varieties, presenting a long overdue discussion of this little-noticed and under-rated mental asset that matters enormously for how we navigate life.'),-- 4
  ('https://images.squarespace-cdn.com/content/v1/564a53ace4b0ef1eb2daff41/1524810192099-QZZKCRPMM2D2692XHZZG/ke17ZwdGBToddI8pDm48kICklUNFB7EJNlxLHLJAYcV7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QPOohDIaIeljMHgDF5CVlOqpeNLcJ80NK65_fV7S1UfYltZe-IEpAgU9jtQqUOcEJ6Rv2liazs--vysdkcEey6kSrJ3a5Sgz-k5JEO5jghA/Cover+Make+it+Stick.jpg', 'Make It Stick', 'Memory plays a central role in our ability to carry out complex cognitive tasks, such as applying knowledge to problems never before encountered and drawing inferences from facts already known. New insights into how memory is encoded, consolidated, and later retrieved have led to a better understanding of how we learn. Grappling with the impediments that make learning challenging leads both to more complex mastery and better retention of what was learned.'), -- 5
  ('https://images-na.ssl-images-amazon.com/images/I/91pR9wKJ3zL.jpg', 'Atomic Habits', 'Transform your life with tiny changes in behaviour, starting now. People think that when you want to change your life, you need to think big. But world-renowned habits expert James Clear has discovered another way. He knows that real change comes from the compound effect of hundreds of small decisions: doing two push-ups a day, waking up five minutes early, or holding a single short phone call.'), -- 6 
  ('https://images-na.ssl-images-amazon.com/images/I/51z1ZaEn6sL._AC_SY400_.jpg', 'Permanent Record', 'In 2013, twenty-nine-year-old Edward Snowden shocked the world when he broke with the American intelligence establishment and revealed that the United States government was secretly pursuing the means to collect every single phone call, text message, and email. The result would be an unprecedented system of mass surveillance with the ability to pry into the private lives of every person on earth. Six years later, Snowden reveals for the very first time how he helped to build this system and why he was moved to expose it.'), -- 7
  ('https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1567191193l/25698._SY475_.jpg', 'The Wealth Of Nations', 'The Wealth of Nations is an economics book like no other. First published in 1776, Adam Smiths groundbreaking theories provide a recipe for national prosperity that has not been bettered since. It assumes no prior knowledge of its subject, and over 200 years on, still provides valuable lessons on the fundamentals of economics.'),  -- 8
  ('https://cdn.shopify.com/s/files/1/2046/9261/products/9789814266727-_Hard_Truths_to_Keep_Singapore_Going_English__LR_1200x1200.jpg?v=1503485822', 'Hard Truths To Keep Singapore Going', 'Why is Lee so hard on his political opponents? Could the PAP ever lose its grip on power? Are the younger leaders up to the mark? Will growing religiosity change Singapore for the better of worse? How will rising giants China and India affect Singapores fortunes?'), -- 9
  ('https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1440657672l/46674._SY475_.jpg' , 'Feeling Good', 'The good news is that anxiety, guilt, pessimism, procrastination, low self-esteem, and other black holes of depression can be cured without drugs. In Feeling Good, eminent psychiatrist David D. Burns, M.D. outlines the remarkable, scientifically proven techniques that will immediately lift your spirits and help you develop a positive outlook on life.'), -- 10
  ('https://dg.imgix.net/a-hunger-for-god-en/portrait/a-hunger-for-god.jpg?ts=1471288268&ixlib=rails-4.2.0&auto=format%2Ccompress&fit=max&w=240&dpr=2&ch=Width%2CDPR', 'A Hunger For God', 'Our appetites dictate the direction of our lives--whether it be the cravings of our stomachs, the passionate desire for possessions or power, or the longings of our spirits for God. But for the Christian, the hunger for anything besides God can be an archenemy, while our hunger for God--and him alone--is the only thing that will bring victory.'), -- 11
  ('https://m.media-amazon.com/images/I/413nm8JQ11L.jpg', 'The Mortification Of Sin', 'John Owen insisted on the importance of the Christian dealing effectively with their sinful tendencies and attitudes. He believed that God, through his Word and Spirit, had provided the guidelines and the power for this to be achieved.
'), -- 12
  ('https://images-na.ssl-images-amazon.com/images/I/31F7hR4hztL._SY291_BO1,204,203,200_QL40_ML2_.jpg', 'How Does Sanctification Work?', 'The process of sanctification is personal and organic--not a one-size-fits-all formula.Many popular views try to reduce the process of Christian growth to a single template. For example, remember past grace. Rehearse your identity in Christ. Avail yourself of the means of grace. Discipline yourself. But Scripture portrays the dynamics of sanctification in a rich variety of ways. No single factor, truth, or protocol can capture why and how a person is changed into the image of Christ. '), -- 13
  ('https://images-na.ssl-images-amazon.com/images/I/91Z6ApocmwL.jpg', 'How To Read A Book', 'Originally published in 1940, this book is a rare phenomenon, a living classic that introduces and elucidates the various levels of reading and how to achieve them--from elementary reading, through systematic skimming and inspectional reading, to speed reading.'); -- 14
 

INSERT INTO book_authors (book_id, author_id)
VALUES 
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 4),
  (5, 5),
  (5, 6),
  (5, 7),
  (6, 8),
  (7, 9),
  (8, 10),
  (9, 11),
  (10, 12),
  (11, 13),
  (12, 14),
  (13, 15),
  (14, 16),
  (14, 17);


INSERT INTO authors (author_name)
VALUES 
  ('Jordan B. Peterson'), -- 1
  ('Henry Kissinger'), -- 2
  ('David Epstein'), -- 3
  ('Daniel Goleman'), -- 4
  ('Peter C. Brown'), -- 5
  ('Henry L. Roediger III'), -- 6
  ('Mark A. McDaniel'), -- 7
  ('James Clear'), -- 8
  ('Edward Snowden'), -- 9
  ('Adam Smith'), -- 10
  ('Lee Kuan Yew'), -- 11
  ('David D. Burns'), -- 12
  ('John Piper'), -- 13
  ('John Owen'), -- 14
  ('David A. Powlison'), -- 15 
  ('Mortimer J. Adler'),-- 16 
  ('Charles Van Doren'); -- 17
  

INSERT INTO book_genres (book_id, genre_id)
VALUES 
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 8),
  (2, 2),
  (2, 7),
  (2, 8),
  (2, 7),
  (3, 1),
  (3, 4),
  (3, 5),
  (3, 8),
  (4, 4),
  (4, 6),
  (4, 8),
  (5, 4),
  (5, 6),
  (5, 8),
  (5, 9),
  (6, 4),
  (6, 6),
  (6, 8),
  (7, 7),
  (7, 8),
  (7, 10),
  (8, 8),
  (8, 2),
  (8, 10),
  (9, 6),
  (9, 4),
  (9, 8),
  (10, 4),
  (10, 8),
  (10, 6),
  (11, 4),
  (11, 8),
  (11, 6),
  (12, 11),
  (13, 6),
  (13, 11),
  (14, 8),
  (14, 4),
  (14, 9);

INSERT INTO genres (genre_name)
VALUES 
  ('Business'), -- 1
  ('History'), -- 2
  ('Science'), -- 3
  ('Self-help'), -- 4
  ('Philosophy'), -- 5 
  ('Psychology'), -- 6
  ('Politics'), -- 7
  ('Non-fiction'), -- 8
  ('Education'), -- 9
  ('Biography'), -- 10
  ('Religion'), -- 11
  ('Classics'); -- 12
   




