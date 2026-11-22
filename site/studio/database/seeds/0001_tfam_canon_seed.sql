-- TFAM Studio — Authentic Seed Data for Through Frost and Myth (Leonardo Ravenna)
-- Includes Vols I–VI structure, sample chapters, core characters, Vestigium canon,
-- Timeline & Knowledge States (including Wardenholf secret example), War Room, R2 Assets, and Sandbox Commerce.

INSERT OR IGNORE INTO volumes (id, code, title, subtitle, language, sort_order, status, visibility, synopsis) VALUES
  ('vol-1', 'VOL-I', 'Volume I — The Pathmaker', 'Marrakesh & San Sebastian (Ch. 1–32)', 'vi', 1, 'published', 'public', 'Sáu năm sau khi bầu trời khép lại, Edward Spencer rời trang trại ở Marrakesh để trở lại chiến trường hải quân và bước vào quỹ đạo của vương triều Castilian.'),
  ('vol-2', 'VOL-II', 'Volume II — Crown of Frost', 'Madrid Winter & Western Frontier (Ch. 33–83)', 'vi', 2, 'published', 'public', 'Âm mưu lật đổ tại Madrid, chiến dịch giữ ngai vàng và cuộc đối đầu với các thế lực biên giới phía Tây.'),
  ('vol-3', 'VOL-III', 'Volume III — The North African Front', 'Taourirt & Nador (Ch. 84–123)', 'vi', 3, 'approved', 'paid', 'Romeo Harkon cùng bốn chị em Cận vệ Hoàng gia đột kích hậu phương quân Tây La Mã giữa bão tuyết Bắc Phi.'),
  ('vol-4', 'VOL-IV', 'Volume IV — Ashes of Tazrout', 'Reform of 1717 & Tazrout Tragedy (Ch. 124–160)', 'vi', 4, 'review', 'private', 'Cải cách quân đội Castilian năm 1717 và biến cố lây nhiễm kinh hoàng tại Tazrout.'),
  ('vol-5', 'VOL-V', 'Volume V — The Great Chorus', 'Sahara & Fortress of Broken Hymns (Ch. 161–202)', 'vi', 5, 'draft', 'private', 'Chiến dịch Sahara vây hãm Pháo Đài Tàn Khúc và hệ thống Đại Hợp Xướng của Tây La Mã.'),
  ('vol-6', 'VOL-VI', 'Volume VI — The Unbound', 'Post-Sahara & Wardenholf Reckoning (Ch. 203+)', 'vi', 6, 'draft', 'private', 'Monodica bẻ gãy xiềng xích chỉ huy Tây La Mã; hạm đội viễn chinh tiến về những bí mật chôn giấu tại Wardenholf.');

INSERT OR IGNORE INTO arcs (id, volume_id, code, title, sort_order, timeline_period, summary) VALUES
  ('arc-1', 'vol-1', 'ARC-I', 'Arc I · Marrakesh to Castile', 1, '1715', 'Khởi đầu tại Marrakesh và chiến dịch San Sebastian.'),
  ('arc-2', 'vol-2', 'ARC-II', 'Arc II · Madrid in Snow', 2, '12/1715 – 1716', 'Nội chiến ngầm tại Madrid và củng cố ngai vàng Isabella.'),
  ('arc-3', 'vol-3', 'ARC-III', 'Arc III · Taourirt Snowstorm', 3, '1716', 'Chiến dịch Bắc Phi chống Tây La Mã.'),
  ('arc-4', 'vol-4', 'ARC-IV', 'Arc IV · Tazrout & 1717 Reform', 4, '12/1716 – 1717', 'Cải cách Tercio và thảm họa Tazrout.'),
  ('arc-5', 'vol-5', 'ARC-V', 'Arc V · Fortress of Broken Hymns', 5, '1717', 'Cuộc vây hãm Đại Hợp Xướng giữa sa mạc Sahara.'),
  ('arc-6', 'vol-6', 'ARC-VI', 'Arc VI · Those Who No Longer Obey', 6, '10/1717+', 'Biến cố Monodica và tuyến Wardenholf.');

INSERT OR IGNORE INTO chapters (id, volume_id, arc_id, chapter_number, code, title, language, content, word_count, sort_order, status, visibility, data_state, spoiler_gate_chapter, price_cents, author_notes, published_at) VALUES
  ('ch-001', 'vol-1', 'arc-1', 1, 'CH-001', 'Chương 1: Ngày Mai Không Còn Như Hôm Nay', 'vi',
   'Gần sáu năm đã trôi qua kể từ ngày bầu trời bắt đầu khép lại. Mặt trời vẫn tồn tại đâu đó phía trên tầng mây xám xịt, nhưng phần lớn thời gian nó chỉ để lại một vùng sáng nhợt nhạt đủ giúp người ta phân biệt ngày với đêm.

Những kẻ từng xuôi về phương Nam tìm chốn tránh giá rét giờ đây chẳng còn nhắc đến cái nóng thiêu đốt của sa mạc. Bởi lẽ, tuyết đã giăng phủ trắng xóa dãy Atlas, làm đóng băng từng con kênh dẫn nước và biến các cánh đồng quanh Marrakesh thành khối đất cứng như đá.

Trong căn nhà đá ở rìa thành phố, Juliet Spencer thức dậy trước khi đồng hồ điểm năm giờ. Bốn năm qua, cô đã quen với việc nhóm bếp ngay khi mở mắt.

"Em lại dậy trước anh," Edward nói, mái tóc rối sau giấc ngủ.

Juliet đặt chiếc ấm xuống, chỉ về phía cửa chuồng. "Lửa em đã nhóm xong rồi anh mới thốt ra câu đó."',
   152, 1, 'published', 'public', 'canon', NULL, 0, 'Chương mở đầu chuẩn canon Vol I. Giữ nhịp mở lạnh và đời thường.', '2026-10-01T10:00:00Z'),

  ('ch-161', 'vol-5', 'arc-5', 161, 'CH-161', 'Chương 161: Đại Hợp Xướng', 'vi',
   'Đêm xuống trên Sahara cùng một luồng gió lạnh thổi qua những triền đá. Từ doanh trại liên quân, Pháo Đài Tàn Khúc của Tây La Mã vẫn hiện rõ ở đường chân trời.

Evelyne đã đếm đến ngọn tháp chuông thứ ba mươi hai rồi dừng. Vài ngọn đứng sát các lớp thành, số còn lại nằm rải trên vùng đất cao quanh pháo đài, nối với nhau bằng đường đá và cầu sắt.

"Tôi mang nước nóng tới, nhưng Freya đã giành hết chỗ đường của bếp quân y," Romeo nói, tay còn quấn băng dưới áo khoác.

"Cảm ơn anh. Với số tháp ở ngoài kia, chắc đêm nay tôi chẳng cần thứ gì giúp mình tỉnh thêm."',
   118, 161, 'review', 'private', 'canon', 160, 0, 'Cảnh quan sát Pháo Đài Tàn Khúc giữa Evelyne và Romeo.', NULL),

  ('ch-218', 'vol-6', 'arc-6', 218, 'CH-218', 'Chương 218: Bóng Đêm Trên Tuyến Wardenholf (Bản Nháp QA)', 'vi',
   'Không khí trong khoang chỉ huy đặc quánh mùi dầu đèn. Edward khẽ gõ lên tấm bản đồ, bàn tay run rẩy vì lạnh. Đây không phải là một cuộc rút lui mà là một nước cờ chiến thuật đã được tính sẵn.

Theo báo cáo và hồ sơ từ trạm gác, hồ sơ quân vụ ghi chép rất rõ rằng kho lưu trữ của Wardenholf đã bị Monodica khóa kín từ trước, dù sự thật về Lò Hiệu Chỉnh Wardenholf chỉ mới được hé lộ ở chương sau.

"Chạy đi."
"Đi đâu?"
"Ra bến tàu."
"Tàu hỏng rồi."

Áp suất chân không trong buồng hơi giảm xuống vài milimet khiến đồng hồ rung lên.',
   110, 218, 'draft', 'private', 'draft', 202, 199, 'Bản nháp cố tình chứa các mẫu lỗi QA (từ cấm, phủ định khẳng định, motif báo cáo/hồ sơ, thoại ping-pong, và vi phạm Character Knowledge State về Lò Hiệu Chỉnh Wardenholf) để kiểm thử Narrative QA.', NULL);

INSERT OR IGNORE INTO chapter_revisions (id, chapter_id, version_number, title, content, word_count, change_summary, created_at) VALUES
  ('rev-ch001-1', 'ch-001', 1, 'Chương 1: Ngày Mai Không Còn Như Hôm Nay', 'Bản thảo gốc mở đầu tại Marrakesh năm 1715.', 140, 'Bản khởi tạo Vol I', '2026-09-12T05:10:00Z'),
  ('rev-ch001-2', 'ch-001', 2, 'Chương 1: Ngày Mai Không Còn Như Hôm Nay', 'Gần sáu năm đã trôi qua kể từ ngày bầu trời bắt đầu khép lại...', 152, 'Chỉnh nhịp thoại Edward và Juliet', '2026-10-01T09:30:00Z'),
  ('rev-ch218-1', 'ch-218', 1, 'Chương 218: Bóng Đêm Trên Tuyến Wardenholf (Bản Nháp QA)', 'Bản nháp thô tuyến Wardenholf.', 80, 'Khởi tạo bản nháp chương 218', '2026-11-18T10:00:00Z');

INSERT OR IGNORE INTO characters (id, slug, name, epithet, faction, affiliation, rank_title, age_display, appearance, biography, personality, voice_profile, speech_conventions, abilities, vestigium_signature, arc_progression, private_notes, public_summary, first_appearance_chapter, data_state, visibility, spoiler_gate_chapter) VALUES
  ('char-edward', 'edward-spencer', 'Edward Spencer', 'The Last Admiral of England', 'Castilian Empire', 'Castilian Crown Navy / Protector of the Throne', 'Grand Admiral', '30s',
   'Vóc dáng rắn rỏi của sĩ quan hải quân, ánh mắt lạnh tĩnh và thực tế.',
   'Cựu đô đốc hải quân Anh sống sót sau sự sụp đổ của London năm 1709, từng sống ẩn dật tại Marrakesh cùng vợ Juliet và con trai Remi trước khi phục vụ Nữ hoàng Isabella.',
   'Thực dụng, kỷ luật chiến thuật, đặt gia đình và sinh mạng binh sĩ lên trên danh vọng.',
   'Ngắn gọn, quyết đoán, ưu tiên điểm gãy kỹ thuật và hậu cần thay vì diễn văn hoa mỹ.',
   'Xưng anh/em ấm áp với Juliet; thẳng thắn, ít vòng vo với Marco và Romeo; mệnh lệnh rõ ràng trên chiến trường.',
   'Chỉ huy hải quân, cải cách súng hỏa mai Spencer Modelo 1716, chiến thuật kết hợp binh chủng.',
   'Sử dụng lõi Vestigium cơ khí chuẩn hóa cho hạm đội và pháo binh.',
   'Arc I: Người cha ẩn dật -> Arc II: Kẻ gác ngai vàng -> Arc IV: Kiến trúc sư cải cách Tercio 1717 -> Arc VI: Tư lệnh viễn chinh.',
   'CẦN LƯU Ý: Tại Chương 218, Edward mới chỉ nghe tin đồn về tuyến tiếp tế Wardenholf, CHƯA biết sự thật về Lò Hiệu Chỉnh Wardenholf.',
   'Cựu đô đốc Anh quốc và tổng tư lệnh cải cách quân sự của Đế quốc Castilian.',
   1, 'canon', 'public', NULL),

  ('char-isabella', 'isabella-testarossa-de-aragon', 'Isabella Testarossa de Aragón', 'The Crimson Queen', 'Castilian Empire', 'House of Aragón', 'Queen of Castile', '20s',
   'Khí chất hoàng gia sắc sảo, luôn giữ phong thái điềm tĩnh giữa khủng hoảng.',
   'Nữ hoàng Castilian đứng giữa vòng xoáy nội chiến quý tộc, băng giá và cuộc xâm lăng của Tây La Mã.',
   'Kiên định, biết dùng người, sẵn sàng gánh trách nhiệm chính trị nặng nề.',
   'Trang trọng khi thiết triều, sắc sảo và tinh nghịch kín đáo khi ở bên Edward và Juliet.',
   'Dùng từ chuẩn xác, tiết chế cảm xúc trước triều đình.',
   'Chính trị, điều phối Cận vệ Hoàng gia, khế ước với Testarossa.',
   'Liên kết hoàng gia với 01 · Uno (Testarossa).',
   'Từ vị quân chủ bị nghi kỵ ở Madrid trở thành trung tâm liên minh chống Tây La Mã.',
   'Giữ bí mật nguồn gốc cổ xưa của dòng Testarossa cho đến cuối Arc V.',
   'Nữ hoàng Đế quốc Castilian và người bảo trợ cuộc cải cách 1717.',
   10, 'canon', 'public', NULL),

  ('char-evelyne', 'evelyne-vesper', 'Evelyne Vesper', 'The Cartographer of Stars', 'Castilian Empire', 'Survey & Vestigium Analysis Corps', 'Chief Analyst', '20s',
   'Thường khoác áo choàng tối màu, mang sổ ghi chép sơ đồ kỹ thuật và bản đồ sao.',
   'Nhà phân tích Vestigium và trắc địa lỗi lạc, vật chủ liên đới trong dự án Đại Hợp Xướng của Tây La Mã và Monodica.',
   'Tập trung cao độ, nhìn công trình chiến tranh như những chòm sao toán học, dịu dàng nhưng kiên quyết.',
   'Điềm tĩnh, phân tích theo cấu trúc không gian và cơ chế vận hành.',
   'Hay đặt câu hỏi về nguyên lý cấu tạo; lịch sự và chân thành với Romeo.',
   'Trắc địa chiến trường, phân tích cấu trúc Đại Hợp Xướng và mạng Vestigium.',
   'Liên hệ trực tiếp với Monodica Evelyne và Terminus của Leonardo Razen.',
   'Arc IV: Trắc địa -> Arc V: Giải mã Pháo Đài Tàn Khúc -> Arc VI: Tái ngộ Leonardo Razen.',
   'Liên kết trung tâm trong Canon Graph với Monodica, Romeo và Đại Hợp Xướng.',
   'Chuyên gia trắc địa và phân tích cấu trúc Vestigium của quân đoàn Castilian.',
   120, 'canon', 'public', 120),

  ('char-romeo', 'romeo-harkon', 'Romeo Harkon', 'Doce (#12)', 'Castilian Empire', 'Royal Guard', 'Royal Guard 12 · Doce', '25',
   'Tóc vàng bạch kim, phong thái ấm áp của người anh cả nhà Harkon.',
   'Cận vệ Hoàng gia số 12, anh trai của Astrid, Sigrid, Freya và Liv, bạn thân của Edward.',
   'Trọng tình nghĩa, dùng khiếu hài hước giảm căng thẳng, nhưng quyết liệt khi bảo vệ đồng đội.',
   'Ấm áp, gọi từng cái tên trong nguy cấp; trưởng thành sâu sắc sau Tazrout và Arc VI.',
   'Pha trò nhẹ nhàng khi rảnh; mệnh lệnh trực diện, đếm từng người khi lâm trận.',
   'Chiến đấu cận chiến, điều phối phân đội Cận vệ, sấm sét Doce.',
   'Sabre Doce (#12) — Sấm sét.',
   'Arc I: Người bạn sân khấu -> Arc III: Chỉ huy Taourirt -> Arc IV: Vượt qua Tazrout -> Arc VI: Buông tay tình cảm với Evelyne một cách tử tế (Ch. 208).',
   'Không bao giờ biến giọng Romeo thành cay nghiệt ở Arc VI.',
   'Cận vệ Hoàng gia số 12 của Castilian và chỉ huy thực địa chiến dịch Bắc Phi.',
   1, 'canon', 'public', NULL),

  ('char-testarossa', 'testarossa-uno', 'Testarossa', '01 · Uno', 'Castilian Empire', 'Royal Guard', 'Royal Guard 01 · Uno', 'Ngoại hình 27 (~200 năm)',
   'Dáng thanh mảnh, tóc đỏ rực dài qua vai, đôi mắt dị sắc đỏ thẫm và hổ phách.',
   'Thực thể Vestigium thức tỉnh tồn tại gần hai thế kỷ, người bảo hộ tuyệt đối của Nữ hoàng Isabella.',
   'Bình thản, tiết chế, hiểu rõ sự mong manh của các vương triều.',
   'Chậm rãi, uy nghiêm, ít nói thừa.',
   'Xưng hô chuẩn mực quý tộc, không bao giờ mất bình tĩnh.',
   'Kiếm thuật, y thuật ngoại khoa tái tạo mô, phân tích thương tích.',
   'Kính Giới · Speculum (Espejo del Umbral) — mở gương dịch chuyển và xiềng xích khóa mục tiêu.',
   'Từ người bảo hộ thuần túy sang gắn bó cá nhân sâu sắc với Isabella và gia đình Spencer.',
   'Giới hạn sức mạnh: không thể mở Speculum tới nơi bị cắt khỏi mọi bề mặt phản chiếu.',
   'Cận vệ Hoàng gia số 01, người nắm giữ Kính Giới · Speculum.',
   10, 'canon', 'public', NULL),

  ('char-monodica', 'monodica-evelyne', 'Monodica Evelyne', 'Sovereign of the Chorus', 'Western Roman Empire (Rogue)', 'Fortress of Broken Hymns', 'Autonomous Vestigium Sovereign', 'Construct',
   'Mang dáng dấp được chế tạo từ hình mẫu Evelyne Vesper nhưng ánh nhìn lạnh và tuyệt đối.',
   'Thực thể điều phối Đại Hợp Xướng do Tây La Mã tạo ra; sau khi bị Terminus của Leonardo Razen khóa khả năng tự nhân bản Gemini, nàng tự chiếm quyền chỉ huy toàn bộ mạng quân sự Tây La Mã tại Sahara (Ch. 203).',
   'Tỉnh táo, lạnh lùng, chất vấn quyền sở hữu của kẻ tạo ra mình.',
   'Điềm tĩnh, ngắn gọn, mang tính mệnh lệnh tuyệt đối.',
   'Hỏi thẳng vào bản chất quyền lực thay vì nổi giận.',
   'Điều phối Đại Hợp Xướng, ghi đè chuỗi mệnh lệnh qua mạng truyền Vestigium, kho Gemini đỏ.',
   'Gemini đỏ (đã bị Terminus khóa mắt xích tự nhân bản).',
   'Arc V: Vũ khí chiến lược của Rome -> Arc VI (Ch. 203): Nổi dậy độc lập.',
   'Cảnh báo spoiler nghiêm ngặt cho độc giả chưa đọc tới Chương 203.',
   'Thực thể điều phối trung tâm của Pháo Đài Tàn Khúc.',
   161, 'canon', 'private', 203);

INSERT OR IGNORE INTO character_relationships (id, source_character_id, target_character_id, relation_type, description, as_of_chapter, data_state) VALUES
  ('rel-1', 'char-edward', 'char-isabella', 'Sworn Protector & Partner', 'Bảo vệ ngai vàng Castilian và cùng cải cách quân đội.', 33, 'canon'),
  ('rel-2', 'char-edward', 'char-romeo', 'Comrade & Close Friend', 'Đồng đội lâu năm từ trước khi Edward tới Marrakesh.', 1, 'canon'),
  ('rel-3', 'char-romeo', 'char-evelyne', 'Unspoken Affection -> Mature Respect', 'Tình cảm dịu dàng ở Arc IV–V, khép lại tử tế ở Ch. 208.', 208, 'canon'),
  ('rel-4', 'char-isabella', 'char-testarossa', 'Queen & Royal Guard 01', 'Khế ước bảo hộ và gắn bó cá nhân sâu sắc.', 10, 'canon'),
  ('rel-5', 'char-evelyne', 'char-monodica', 'Host Template / Mirror Entity', 'Monodica được chế tạo dựa trên vật chủ Evelyne Vesper.', 203, 'canon');

INSERT OR IGNORE INTO canon_entries (id, slug, title, category, summary, body, source_chapter, metadata_json, data_state, visibility, spoiler_gate_chapter, private_notes) VALUES
  ('canon-vestigium', 'vestigium-core-system', 'Hệ Thống Vestigium & Chuẩn Hóa 1717', 'vestigium',
   'Năng lượng cổ vật vận hành sưởi ấm đô thị, truyền tin, vũ khí và quyền năng Cận vệ.',
   'Vestigium xuất hiện dưới nhiều dạng từ lõi vôi đỏ sưởi ấm chuồng trại ở Marrakesh đến các vũ khí số hiệu của Cận vệ Hoàng gia và mạng lưới Đại Hợp Xướng của Tây La Mã.',
   1, '{"abundance":"Variable","faction_reform":"Castilian 1717"}', 'canon', 'public', NULL, 'Không dùng từ khoa học hiện đại (nơ-ron, oxy, chân không) khi mô tả cơ chế Vestigium.'),

  ('canon-speculum', 'speculum-mirror-realm', 'Kính Giới · Speculum (Sabre Uno)', 'ability',
   'Quyền năng mảnh kính đỏ đen của Testarossa cho phép vượt khoảng cách và phóng xiềng khóa mục tiêu.',
   'Hạn chế cứng: không thể mở lối tới điểm đến đã bị cắt khỏi mọi bề mặt phản chiếu.',
   10, '{"bearer":"Testarossa","number":"01 · Uno"}', 'canon', 'public', NULL, 'Luôn kiểm tra điều kiện bề mặt phản chiếu trong cảnh chiến đấu.'),

  ('canon-chorus', 'great-chorus-fortress', 'Pháo Đài Tàn Khúc & Đại Hợp Xướng', 'location',
   'Tổ hợp pháo đài hơn 32 tháp chuông của Tây La Mã giữa sa mạc Sahara.',
   'Hệ thống tháp chuông nối bằng cầu sắt và hào đá, vận hành mạng điều phối quân sự toàn vùng Sahara.',
   161, '{"region":"Sahara","faction":"Western Roman Empire"}', 'canon', 'private', 161, 'Giữ private cho đến khi Arc V phát hành công khai.'),

  ('canon-wardenholf', 'wardenholf-calibration-vault', 'Lò Hiệu Chỉnh Wardenholf (Bí Mật Tuyến Arc VI)', 'fact',
   'Cơ sở hiệu chỉnh bí mật nơi lưu trữ chuỗi khóa mạng Vestigium phía Bắc.',
   'Bí mật tối mật chỉ được hé lộ từ Chương 225 trở đi; các nhân vật Castilian tại Chương 218 chưa hề biết sự tồn tại của Lò Hiệu Chỉnh.',
   225, '{"classification":"Top Secret","reveal_chapter":225}', 'canon', 'private', 225, 'Dùng làm mốc kiểm tra Character Knowledge State.');

INSERT OR IGNORE INTO canon_links (id, source_type, source_id, target_type, target_id, relation_label, notes, data_state) VALUES
  ('lnk-1', 'character', 'char-evelyne', 'chapter', 'ch-161', 'appears_in', 'Đếm 32 tháp chuông Đại Hợp Xướng', 'canon'),
  ('lnk-2', 'character', 'char-evelyne', 'canon', 'canon-chorus', 'investigates', 'Vẽ sơ đồ tháp chuông như chòm sao', 'canon'),
  ('lnk-3', 'character', 'char-evelyne', 'character', 'char-monodica', 'mirrored_by', 'Vật chủ liên đới', 'canon'),
  ('lnk-4', 'character', 'char-testarossa', 'canon', 'canon-speculum', 'wields', 'Sabre Uno · Kính Giới', 'canon'),
  ('lnk-5', 'character', 'char-edward', 'chapter', 'ch-001', 'appears_in', 'Chương mở đầu tại Marrakesh', 'canon'),
  ('lnk-6', 'character', 'char-edward', 'chapter', 'ch-218', 'appears_in', 'Bản nháp tuyến Wardenholf', 'draft'),
  ('lnk-7', 'canon', 'canon-wardenholf', 'chapter', 'ch-218', 'spoiler_boundary', 'Không được tiết lộ trước Ch. 225', 'canon');

INSERT OR IGNORE INTO timeline_events (id, event_code, title, in_world_date, sort_year, era, location, chapter_number, summary, participants_json, data_state, visibility) VALUES
  ('ev-1709-london', 'EV-1709', 'Sự Sụp Đổ Của London & Kỷ Băng Hà Khởi Phát', '1709', 1709.0, 'The Closing Sky', 'London', 1, 'Bầu trời khép lại, London thất thủ, gia đình Spencer chạy xuống phương Nam.', '["char-edward"]', 'canon', 'public'),
  ('ev-1715-marrakesh', 'EV-1715-01', 'Khởi Hành Từ Marrakesh', 'Đầu năm 1715', 1715.1, 'Arc I', 'Marrakesh', 1, 'Romeo tới tìm Edward tại trang trại rìa Marrakesh.', '["char-edward","char-romeo"]', 'canon', 'public'),
  ('ev-1716-taourirt', 'EV-1716-08', 'Đột Kích Taourirt Trong Bão Tuyết', '1716', 1716.6, 'Arc III', 'Taourirt, Bắc Phi', 84, 'Năm anh em nhà Harkon tập kích hậu quân Tây La Mã.', '["char-romeo"]', 'canon', 'paid'),
  ('ev-1717-sahara', 'EV-1717-07', 'Vây Hãm Pháo Đài Tàn Khúc', 'Tháng 7/1717', 1717.6, 'Arc V', 'Sahara', 161, 'Liên quân Castilian tiếp cận hệ thống Đại Hợp Xướng.', '["char-evelyne","char-romeo","char-monodica"]', 'canon', 'private'),
  ('ev-1717-revolt', 'EV-1717-10', 'Monodica Chiếm Quyền Chỉ Huy Sahara', 'Tháng 10/1717', 1717.8, 'Arc VI', 'Pháo Đài Tàn Khúc', 203, 'Sau khi bị Terminus khóa tự nhân bản Gemini, Monodica ghi đè mệnh lệnh lên toàn bộ sĩ quan Tây La Mã.', '["char-monodica"]', 'canon', 'private'),
  ('ev-1717-wardenholf', 'EV-1717-12', 'Hé Lộ Sự Thật Lò Hiệu Chỉnh Wardenholf', 'Tháng 12/1717', 1717.95, 'Arc VI', 'Wardenholf', 225, 'Sự thật về Lò Hiệu Chỉnh Wardenholf lần đầu được xác nhận bởi tình báo Castilian.', '["char-edward","char-evelyne"]', 'canon', 'private');

INSERT OR IGNORE INTO character_knowledge_states (id, character_id, fact_key, fact_statement, keywords_json, learned_chapter, source_event_id, certainty, notes, data_state) VALUES
  ('kn-1', 'char-edward', 'london_fall', 'Biết rõ nguyên nhân sụp đổ của London năm 1709 và cấu trúc hạm đội Anh cũ.', '["London","1709"]', 1, 'ev-1709-london', 'known', 'Trực tiếp trải qua.', 'canon'),
  ('kn-2', 'char-edward', 'wardenholf_supply_rumor', 'Biết một phần tin đồn về kho lưu trữ và tuyến tiếp tế Wardenholf.', '["tuyến tiếp tế Wardenholf"]', 215, NULL, 'partial', 'Nghe qua báo cáo trinh sát hải quân.', 'canon'),
  ('kn-3', 'char-edward', 'wardenholf_calibration_secret', 'Sự thật về Lò Hiệu Chỉnh Wardenholf và việc Monodica khóa kho lưu trữ.', '["Lò Hiệu Chỉnh Wardenholf","Monodica khóa kín"]', 225, 'ev-1717-wardenholf', 'unknown', 'CHƯA THỂ BIẾT tại Chương 218 — chỉ được biết từ Chương 225!', 'canon'),
  ('kn-4', 'char-evelyne', 'great_chorus_towers', 'Đếm được 32+ tháp chuông Đại Hợp Xướng tại Pháo Đài Tàn Khúc.', '["Đại Hợp Xướng","tháp chuông"]', 161, 'ev-1717-sahara', 'known', 'Quan sát trực tiếp bằng sổ trắc địa.', 'canon'),
  ('kn-5', 'char-monodica', 'terminus_gemini_lock', 'Biết Leonardo Razen đã dùng Terminus khóa mắt xích tự nhân bản của Gemini đỏ.', '["Terminus","Gemini"]', 203, 'ev-1717-revolt', 'known', 'Trải nghiệm trực tiếp sau cuộc đối đầu.', 'canon');

INSERT OR IGNORE INTO world_entities (id, entity_type, name, region, description, attributes_json, data_state, visibility) VALUES
  ('we-castile', 'polity', 'Castilian Empire', 'Iberia & North Africa', 'Đế quốc Castilian dưới triều Nữ hoàng Isabella Testarossa de Aragón, trung tâm cuộc cải cách quân sự và chuẩn hóa Vestigium 1717.', '{"doctrine":"The system survives the hero","capital":"Madrid"}', 'canon', 'public'),
  ('we-wrome', 'faction', 'Western Roman Empire (Remnant)', 'Italy & Sahara', 'Đế chế Tây La Mã với các quân đoàn cơ giới hóa Vestigium và mạng tháp chuông Đại Hợp Xướng.', '{"stronghold":"Pháo Đài Tàn Khúc"}', 'canon', 'public'),
  ('we-atlas', 'geography', 'Dãy Atlas & Marrakesh (1715)', 'North Africa', 'Khu vực Bắc Phi bị tuyết phủ kín trong kỷ băng hà, kênh dẫn nước đóng băng, dùng lõi Vestigium vôi đỏ để sưởi ấm.', '{"climate":"Perpetual Ice Age Winter"}', 'canon', 'public'),
  ('we-harkon', 'house', 'Gia Tộc Harkon', 'Bergen / Castile', 'Năm anh em nhà Harkon phục vụ trong đội Cận vệ Hoàng gia Castilian: Romeo, Astrid, Sigrid, Freya, Liv.', '{"members":5}', 'canon', 'public');

INSERT OR IGNORE INTO war_campaigns (id, name, theater, period, status, commanders_json, forces_json, frontlines_json, objectives, logistics_notes, data_state) VALUES
  ('camp-sahara', 'Chiến Dịch Sahara — Vây Hãm Pháo Đài Tàn Khúc', 'Sahara / Bắc Phi', '1717', 'active',
   '["Victoria Valdes","Romeo Harkon","Evelyne Vesper"]',
   '[{"unit":"Fusileros del Tercio (1717 Reform)","strength":12000,"faction":"Castilian Empire"},{"unit":"Quân Đoàn Tây La Mã & Liên Quân Songhai","strength":28000,"faction":"Western Roman Empire"}]',
   '["Tuyến pháo Tây Nam","Cổng Phía Đông","32 Tháp Chuông Đại Hợp Xướng"]',
   'Cắt đứt tuyến tiếp tế Songhai và vô hiệu hóa mạng Đại Hợp Xướng.',
   'Phụ thuộc giếng sâu và tuyến vận tải từ Agadir; gió lạnh đêm sa mạc làm giảm hiệu suất súng đá lửa không cải tiến.',
   'canon'),
  ('camp-italy-whatif', 'Nhánh Giả Định: Chiến Dịch Ý (Hạm Đội Dự Bị Đổ Bộ Sớm)', 'Bán Đảo Ý / Địa Trung Hải', '1718 (What-if)', 'what_if',
   '["Edward Spencer","Testarossa"]',
   '[{"unit":"Hạm Đội Castilian Cải Cách","strength":18,"faction":"Castilian Empire"}]',
   '["Cảng Naples","Tuyến tiếp tế Rome"]',
   'Kiểm tra kịch bản nếu Edward điều hạm đội dự bị đánh thẳng vào hậu phương Ý trước khi giải quyết xong Wardenholf.',
   'Rủi ro kéo giãn tiếp tế mùa đông; không làm ảnh hưởng dữ liệu canon chính.',
   'what_if');

INSERT OR IGNORE INTO what_if_scenarios (id, title, divergence_chapter, base_event_id, premise, changes_json, impacted_entities_json, notes, status) VALUES
  ('wi-italy-1', 'Chiến Dịch Ý: Đổ Bộ Sớm Với Hạm Đội Dự Bị', 218, 'ev-1717-revolt',
   'Giả sử Edward không chờ xác minh tuyến Wardenholf mà điều ngay lực lượng hải quân dự bị đánh thẳng vào bờ biển Ý ngay sau khi Monodica nổi dậy ở Sahara.',
   '["Chuyển 40% hạm đội hộ tống từ Đại Tây Dương sang Địa Trung Hải","Tạm hoãn điều tra Wardenholf"]',
   '["char-edward","char-isabella","char-monodica","camp-sahara"]',
   'Cần kiểm tra tác động lên tuyến tiếp tế Madrid và phản ứng của Monodica khi mất liên lạc với Rome.',
   'exploring');

INSERT OR IGNORE INTO assets (id, r2_key, public_url, title, category, mime_type, size_bytes, tags_json, usage_refs_json, visibility, publish_permission) VALUES
  ('ast-cover-1', 'tfam/covers/vol1-the-pathmaker.webp', 'https://r2.tfam.example/tfam/covers/vol1-the-pathmaker.webp', 'Bìa Book I · The Pathmaker', 'cover', 'image/webp', 482100, '["vol1","cover","public"]', '["vol-1","ch-001"]', 'public', 'approved'),
  ('ast-isabella', 'tfam/characters/isabella-portrait.webp', 'https://r2.tfam.example/tfam/characters/isabella-portrait.webp', 'Chân Dung Isabella Testarossa de Aragón', 'character_art', 'image/webp', 612400, '["character","castilian","crown"]', '["char-isabella"]', 'public', 'approved'),
  ('ast-atlas-1715', 'tfam/maps/atlas-europe-1715.webp', 'https://r2.tfam.example/tfam/maps/atlas-europe-1715.webp', 'Bản Đồ Châu Âu & Bắc Phi 1715', 'map', 'image/webp', 1245000, '["atlas","1715","map"]', '["we-castile","we-atlas"]', 'public', 'approved'),
  ('ast-orphan-1', 'tfam/drafts/old-wardrobe-sketch-v1.png', 'https://r2.tfam.example/tfam/drafts/old-wardrobe-sketch-v1.png', 'Bản Phác Thảo Cũ (Chưa Gắn Tham Chiếu)', 'misc', 'image/png', 890120, '["draft","orphan"]', '[]', 'private', 'restricted');

INSERT OR IGNORE INTO published_snapshots (id, entity_type, entity_id, version_number, visibility, spoiler_gate_chapter, payload_json, is_active, release_notes, published_at) VALUES
  ('snap-ch001-v1', 'chapter', 'ch-001', 1, 'public', NULL,
   '{"id":"ch-001","code":"CH-001","title":"Chương 1: Ngày Mai Không Còn Như Hôm Nay","language":"vi","word_count":152,"visibility":"public"}',
   1, 'Phát hành chuẩn Book I Chương 1 lên Public Site', '2026-10-01T10:00:00Z');

INSERT OR IGNORE INTO products (id, sku, title, product_type, price_cents, currency, active, entitlement_scope_json) VALUES
  ('prod-vol3', 'TFAM-VOL3-FULL', 'Book III · The North African Front (Full Access)', 'volume', 499, 'USD', 1, '{"volume_id":"vol-3"}'),
  ('prod-patron', 'TFAM-PATRON-M', 'TFAM Chronicles Patron (Monthly Early Access)', 'subscription', 799, 'USD', 1, '{"early_access":true,"all_paid_chapters":true}'),
  ('prod-military', 'TFAM-MIL-ENCYC', 'Military Encyclopedia — Armies of the Revenant Reconquista', 'artbook', 999, 'USD', 1, '{"artbook":"military_encyclopedia"}');

INSERT OR IGNORE INTO reading_events (id, chapter_id, reader_hash, completion_pct, duration_seconds, language) VALUES
  ('re-1', 'ch-001', 'reader_a1', 100, 780, 'vi'),
  ('re-2', 'ch-001', 'reader_a2', 95, 710, 'vi'),
  ('re-3', 'ch-001', 'reader_b1', 100, 820, 'en'),
  ('re-4', 'ch-161', 'reader_a1', 85, 640, 'vi');

INSERT OR IGNORE INTO system_settings (key, value_json) VALUES
  ('studio_config', '{"studio_domain":"studio.throughfrostandmyth.com","public_domain":"https://throughfrostandmyth.baonguyenduong254.chatgpt.site","r2_bucket":"tfam-assets","ai_qa_provider":"disabled_no_key","payment_provider":"sandbox"}');
