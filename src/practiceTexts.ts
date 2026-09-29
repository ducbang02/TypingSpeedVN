// Cách thêm nội dung thủ công:
// 1. Thêm một chuỗi mới vào mảng `vi` hoặc `en` bên dưới.
// 2. Mỗi chuỗi nên là một đoạn hoàn chỉnh, dài khoảng 2–4 câu.
// 3. Nhớ đặt dấu phẩy sau mỗi chuỗi. Không cần sửa logic trong App.tsx.
export const PRACTICE_TEXTS: Record<'en' | 'vi', string[]> = {
  en: [
    'A steady typing rhythm begins with relaxed shoulders and light hands. Keep your eyes on the screen, trust the home row, and let every finger return to its starting key. Accuracy matters more than rushing because clean movement becomes natural speed over time.',
    'Small daily habits create lasting skill. Sit comfortably, breathe normally, and read a few words ahead while your fingers continue to type. When an error appears, stay calm and recover without breaking the rhythm of the whole sentence.',
    'Clear writing starts with focused attention. Type each word as a complete shape instead of chasing one letter at a time. A smooth pace helps the mind and hands work together, making longer passages feel easier with every practice session.',
    'Good typists do not force speed. They build it through accurate repetition, balanced posture, and patient review. Keep both hands near the home row and use the closest finger for every key so each movement remains short and efficient.',
    'Practice is most useful when it feels challenging but controlled. Choose a pace that lets you finish each sentence accurately, then increase the tempo a little. Consistent work for a few minutes each day is enough to create visible progress.',
    'Morning light crossed the quiet window while the city slowly woke. A bicycle bell rang in the distance, leaves moved in the soft wind, and a new day offered another chance to begin with patience.',
    'A useful idea often starts as a simple question. Write the question down, examine it from several angles, and improve the answer one small step at a time. Careful curiosity can turn an ordinary thought into meaningful work.',
    'The old path beside the river looked different after the rain. Stones shone beneath the trees, birds called from the reeds, and the moving water reminded every traveler that change can be both gentle and constant.',
    'A wise saying becomes valuable only when it guides an action. Kind words should lead to kindness, promises should lead to effort, and knowledge should lead to better choices for the people around us.',
    'Reading opens a quiet door into another person’s experience. A few pages can carry us across years and borders, introduce unfamiliar ideas, and help us return to daily life with a wider point of view.',
    'Technology works best when it makes a difficult task feel simple. Thoughtful design removes confusion, protects attention, and gives people enough guidance to move forward without taking away their sense of control.',
    'Progress rarely arrives in one dramatic moment. It grows through ordinary mornings, repeated attempts, honest corrections, and the decision to continue even when the result is not perfect yet.',
  ],
  vi: [
    'Nhịp gõ ổn định bắt đầu từ tư thế ngồi thoải mái và đôi tay thả lỏng. Hãy nhìn vào màn hình, tin vào vị trí hàng phím cơ sở và đưa mỗi ngón tay trở về đúng chỗ sau khi nhấn. Độ chính xác luôn quan trọng hơn việc vội vàng.',
    'Một thói quen nhỏ mỗi ngày có thể tạo nên kỹ năng bền vững. Bạn hãy ngồi thẳng, thở đều và đọc trước vài từ trong khi các ngón tay tiếp tục di chuyển. Khi gõ sai, hãy bình tĩnh sửa lỗi mà không làm mất nhịp của cả câu.',
    'Viết rõ ràng cần sự tập trung. Hãy gõ từng từ như một hình ảnh hoàn chỉnh thay vì đuổi theo từng chữ cái riêng lẻ. Nhịp độ êm giúp suy nghĩ và đôi tay phối hợp tốt hơn, nhờ đó những đoạn văn dài sẽ dần trở nên dễ dàng.',
    'Người gõ tốt không ép mình phải nhanh ngay lập tức. Họ xây dựng tốc độ bằng sự lặp lại chính xác, tư thế cân bằng và việc xem lại kết quả. Hai tay nên ở gần hàng cơ sở để mỗi chuyển động luôn ngắn và hiệu quả.',
    'Bài luyện hiệu quả nên vừa đủ thử thách nhưng vẫn trong tầm kiểm soát. Hãy chọn tốc độ giúp bạn hoàn thành câu thật chính xác, rồi tăng nhịp từng chút một. Chỉ vài phút đều đặn mỗi ngày cũng tạo ra tiến bộ rõ rệt.',
    'Buổi sớm, nắng nghiêng qua khung cửa và đánh thức con phố còn yên tĩnh. Tiếng xe đạp vang xa, lá cây lay nhẹ trong gió, còn một ngày mới mở ra như trang giấy trắng chờ những điều tốt đẹp.',
    'Có công mài sắt, có ngày nên kim là lời nhắc về sức mạnh của sự kiên trì. Việc lớn không nhất thiết bắt đầu bằng bước đi thật dài, mà thường được tạo nên từ nhiều cố gắng nhỏ được lặp lại mỗi ngày.',
    'Dòng sông sau cơn mưa mang theo màu trời trong trẻo. Những viên đá bên bờ sáng lên dưới tán cây, tiếng chim vọng từ bãi lau và mặt nước không ngừng trôi như nhắc người qua đường về sự đổi thay.',
    'Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau. Một câu chân thành có thể làm dịu nỗi buồn, mở đầu cho sự cảm thông và giúp con người đến gần nhau hơn trong những ngày khó khăn.',
    'Mỗi cuốn sách là một cánh cửa yên lặng dẫn vào trải nghiệm của người khác. Chỉ vài trang viết cũng có thể đưa ta đi qua nhiều vùng đất, gặp những ý tưởng mới và trở về với góc nhìn rộng mở hơn.',
    'Công nghệ hữu ích nhất khi biến việc phức tạp thành trải nghiệm dễ hiểu. Một sản phẩm tốt biết loại bỏ sự rối rắm, bảo vệ sự tập trung và hướng dẫn vừa đủ để người dùng luôn cảm thấy chủ động.',
    'Tiến bộ hiếm khi xuất hiện trong một khoảnh khắc thật lớn. Nó được tạo nên từ những buổi sáng bình thường, những lần thử lại, những lỗi được sửa và quyết định tiếp tục dù kết quả hôm nay vẫn chưa hoàn hảo.',
  ],
}
