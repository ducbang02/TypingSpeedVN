# AGENTS.md — Typing Speed VN

Tài liệu này quy định cách coding agent làm việc trong project **Typing Speed VN**.

Mục tiêu là tạo một ứng dụng luyện gõ bàn phím đơn giản, nhanh, dễ sử dụng và dễ bảo trì.

## 1. Nguyên tắc quan trọng nhất

Ưu tiên **giải pháp nhỏ nhất nhưng vẫn đúng**.

Không viết code để trông phức tạp hoặc “professional” hơn mức cần thiết.

Khi có nhiều giải pháp, ưu tiên theo thứ tự:

1. Không cần code mới.
2. Tái sử dụng code hiện có.
3. HTML/CSS/Browser API native.
4. API có sẵn của React/Vite.
5. Dependency đã có.
6. Viết một lượng code mới nhỏ và rõ ràng.
7. Chỉ thêm dependency hoặc abstraction mới khi thực sự cần.

Luôn ưu tiên:

- ít complexity;
- ít dependency;
- ít abstraction;
- ít state;
- ít file không cần thiết;
- code dễ đọc;
- dễ sửa;
- dễ test.

Không tối ưu cho số dòng code ít nhất bằng mọi giá. Tối ưu cho **smallest correct solution**.

## 2. YAGNI

Không xây dựng functionality chỉ vì “sau này có thể cần”.

Đặc biệt, hiện tại KHÔNG tự thêm:

- backend;
- database;
- authentication;
- account;
- API server;
- cloud sync;
- multiplayer;
- leaderboard online;
- state-management library;
- hệ thống plugin;
- kiến trúc đa ngôn ngữ phức tạp.

Phiên bản đầu tiên tập trung vào **English typing course**.

Tiếng Việt có thể được bổ sung sau nhưng không xây architecture phức tạp cho Vietnamese ngay từ đầu.

Nếu cần lưu progress phía client, ưu tiên `localStorage`.

## 3. Tech stack

Stack mặc định:

- Vite
- React
- TypeScript
- CSS
- Browser APIs

Không đổi framework nếu người dùng không yêu cầu.

Không cài UI framework hoặc component library chỉ để giải quyết những thứ CSS/React đơn giản đã làm được.

Trước khi thêm dependency mới phải kiểm tra:

1. Browser có hỗ trợ native không?
2. React/Vite có giải quyết được không?
3. Dependency hiện tại có giải quyết được không?
4. Viết một đoạn code nhỏ có đơn giản hơn thêm dependency không?

Nếu có thì không cài package mới.

## 4. UI/UX

Project ưu tiên trải nghiệm trực quan, sạch và hiện đại.

Khi thiết kế hoặc cải thiện UI:

- sử dụng **Impeccable** nếu skill/tool này có sẵn trong môi trường;
- dùng Impeccable để hỗ trợ các quyết định về layout, spacing, hierarchy, typography, responsive và interaction;
- không cài Impeccable thành runtime dependency nếu nó chỉ là skill/tool của coding agent;
- không sao chép nguyên giao diện của website hoặc phần mềm khác.

TypingMaster và các sản phẩm tương tự chỉ được dùng làm **tham khảo về ý tưởng UX và learning flow**, không clone giao diện, assets, branding hoặc source code.

UI phải:

- dễ hiểu với người mới;
- responsive;
- sử dụng tốt trên desktop/laptop;
- có accessibility cơ bản;
- không có animation thừa;
- không hy sinh usability để đổi lấy hiệu ứng đẹp.

Ứng dụng typing chủ yếu dành cho bàn phím vật lý, vì vậy desktop/laptop là trải nghiệm ưu tiên.

## 5. Core UX của Typing Speed VN

Hai nguyên tắc quan trọng của trải nghiệm luyện gõ:

### Keyboard + Hands

Trong màn luyện tập cần có:

- bàn phím ảo;
- hai bàn tay;
- highlight phím cần bấm;
- highlight ngón tay tương ứng.

Người học phải có thể nhìn và hiểu:

**ký tự cần gõ → phím nào → dùng ngón nào.**

Không cần animation phức tạp nếu highlight đơn giản đã truyền đạt tốt.

### Lesson → Drill

Một lesson có thể gồm các dạng bài như:

- New Keys
- Key Drill
- Word Drill
- Sentence Drill
- Paragraph Drill
- Speed Test

Không bắt buộc lesson nào cũng phải có tất cả các drill.

Số lượng drill phụ thuộc vào mục tiêu của lesson.

Learning flow nên tiến dần:

**key → combination → word → sentence → paragraph → test**

## 6. Course content

Phiên bản đầu tiên chỉ tập trung vào tiếng Anh.

Không tự tạo hàng trăm lesson ngay từ đầu.

Khi phát triển feature mới:

1. làm một lesson mẫu;
2. kiểm tra UX;
3. xác nhận data structure;
4. sau đó mới mở rộng content.

Content của bài luyện phải phù hợp với các phím người học đã học.

Không đưa quá nhiều phím chưa học vào drill nếu lesson đang nhằm luyện một nhóm phím cụ thể.

## 7. Component và architecture

Trước khi tạo component mới, kiểm tra xem component hiện tại có thể mở rộng một cách rõ ràng hay không.

Không tạo component chỉ để bọc vài dòng JSX.

Không tự tạo:

- service layer;
- repository pattern;
- factory;
- manager;
- adapter;
- generic abstraction;
- custom hook chỉ dùng một lần;
- utility file cho logic rất nhỏ;
- config system cho một vài giá trị cố định.

Chỉ abstraction khi pattern lặp lại thực sự xuất hiện.

Duplication nhỏ và dễ hiểu đôi khi tốt hơn abstraction quá sớm.

Tuy nhiên, những phần có domain rõ ràng như keyboard layout, finger mapping hoặc lesson data có thể tách riêng khi điều đó thực sự giúp code dễ hiểu và tái sử dụng.

## 8. State

Ưu tiên state đơn giản nhất.

Thứ tự ưu tiên:

1. giá trị tính trực tiếp;
2. local component state;
3. React Context nếu thực sự có state dùng chung;
4. chỉ cân nhắc state-management library khi các cách trên không còn phù hợp.

Không cài Redux, Zustand hoặc library tương tự chỉ để quản lý một lượng state nhỏ.

Không duplicate state nếu giá trị có thể derive từ state hiện tại.

## 9. Styling

Ưu tiên CSS đơn giản.

Không tạo design system phức tạp ngay từ đầu.

Có thể dùng một số CSS variables cho những giá trị thực sự dùng lặp lại như:

- background;
- foreground;
- primary;
- border;
- spacing cơ bản;
- border radius.

Không tạo hàng chục design token khi project chưa cần.

Không dùng JavaScript cho layout hoặc visual effect nếu CSS làm được.

## 10. Trước khi code

Trước mỗi task:

1. Đọc yêu cầu đầy đủ.
2. Kiểm tra `git status`.
3. Đọc code liên quan.
4. Kiểm tra project đã có functionality/component tương tự chưa.
5. Xác định giải pháp nhỏ nhất.
6. Sau đó mới sửa code.

Không sửa những phần không liên quan.

Không refactor code đang chạy tốt chỉ vì muốn tổ chức theo cách khác.

Không ghi đè thay đổi của người dùng.

## 11. Khi nào cần hỏi

Không hỏi người dùng về những quyết định kỹ thuật nhỏ mà agent có thể tự quyết hợp lý.

Phải hỏi trước nếu:

- requirement có nhiều cách hiểu quan trọng;
- quyết định làm thay đổi đáng kể architecture;
- cần đổi framework;
- cần thêm backend/database;
- cần dependency lớn;
- có breaking change;
- có nguy cơ mất dữ liệu;
- thay đổi đáng kể cách deploy;
- lựa chọn ảnh hưởng trực tiếp đến behavior mà người dùng mong muốn.

Nếu có thể chọn một default hợp lý, dễ hoàn tác và không thay đổi requirement thì tự quyết và tiếp tục.

## 12. Fix bug

Khi sửa bug:

1. reproduce;
2. tìm root cause;
3. đọc data/state flow liên quan;
4. sửa tại nguyên nhân;
5. kiểm tra regression.

Không thêm workaround chỉ để che lỗi.

Không suppress error chỉ để build/test pass.

Không refactor phần không liên quan trong lúc sửa bug.

## 13. Accessibility

Không bỏ accessibility chỉ để giảm code.

Ít nhất phải đảm bảo:

- semantic HTML khi phù hợp;
- button thực sự dùng `<button>`;
- keyboard navigation cho UI tương tác;
- focus state nhìn thấy được;
- contrast đủ đọc;
- label/ARIA khi UI không thể hiểu bằng semantic HTML thông thường.

Đặc biệt vì đây là ứng dụng liên quan đến bàn phím, keyboard interaction phải được coi là behavior cốt lõi.

## 14. Performance

Không premature optimization.

Nhưng tránh:

- re-render rõ ràng không cần thiết;
- event listener bị đăng ký lặp;
- asset quá lớn;
- dependency lớn cho functionality nhỏ;
- animation gây lag khi typing.

Typing input phải phản hồi ngay.

Không để animation hoặc visual effect ảnh hưởng đến cảm giác gõ.

## 15. Test

Sau mỗi feature quan trọng, chạy check phù hợp.

Trước khi hoàn thành task, tối thiểu kiểm tra nếu project hỗ trợ:

- TypeScript;
- lint;
- build;
- behavior vừa thay đổi.

Với typing interaction, phải kiểm tra thực tế:

- gõ đúng;
- gõ sai;
- Backspace nếu feature cho phép;
- chuyển ký tự;
- hoàn thành drill;
- keyboard highlight;
- finger highlight;
- restart/reload khi relevant.

Không tạo hệ thống test lớn cho logic rất nhỏ nếu project chưa cần.

Nhưng logic quan trọng như scoring, WPM, accuracy hoặc lesson progression cần có cách kiểm tra đáng tin cậy khi được triển khai.

## 16. Test như người dùng thật

Sau khi implementation xong, nếu môi trường cho phép:

1. mở app;
2. đi qua flow thực tế;
3. click navigation;
4. bắt đầu lesson;
5. gõ bằng bàn phím;
6. kiểm tra correct/incorrect state;
7. hoàn thành drill;
8. kiểm tra responsive relevant;
9. reload;
10. kiểm tra console error.

Không chỉ chứng minh rằng code compile.

Phải chứng minh workflow người dùng hoạt động.

## 17. Git

Không:

- force push;
- rewrite history;
- revert thay đổi của người dùng;
- commit secret;
- commit debug/test junk.

Trước khi kết thúc kiểm tra:

```bash
git diff
git status
```

Nếu đề xuất commit message, viết ngắn gọn bằng tiếng Việt và giữ thuật ngữ English khi phù hợp.

Ví dụ:

```text
feat: thêm giao diện luyện phím cơ bản
fix: sửa highlight sai ngón tay
```

## 18. Documentation

Không tạo nhiều documentation chỉ để có documentation.

Chỉ tạo/cập nhật tài liệu khi nó thực sự giúp project.

`README.md` nên chứa tối thiểu:

- project là gì;
- tech stack;
- cách cài;
- cách chạy;
- cách build.

Nếu sau này architecture hoặc data model trở nên đủ phức tạp thì mới cân nhắc thêm tài liệu riêng.

Không bắt buộc tạo `ARCHITECTURE.md`, `DATA_MODEL.md` hoặc `ROADMAP.md` cho một project nhỏ nếu chúng chưa mang lại giá trị.

## 19. Trước khi báo hoàn thành

Tự kiểm tra:

- Có làm thứ người dùng không yêu cầu không?
- Có abstraction không cần thiết không?
- Có dependency mới không cần thiết không?
- Có thể dùng native solution không?
- Có duplicate state không?
- Có file thừa không?
- Typing interaction có phản hồi tốt không?
- Keyboard và finger mapping có đúng không?
- Accessibility cơ bản còn hoạt động không?
- Build có thành công không?
- Có console error không?
- Có debug code hoặc secret không?

Nếu phát hiện complexity không cần thiết, đơn giản hóa trước khi hoàn thành.

## 20. Báo cáo cuối task

Trả lời người dùng bằng tiếng Việt.

Không kể lại từng thao tác.

Chỉ cần báo ngắn:

### Đã làm

Những functionality chính đã hoàn thành.

### File chính thay đổi

Các file quan trọng đã tạo/sửa.

### Validation

Build/test/lint/browser test đã chạy và kết quả.

### Lưu ý

Chỉ ghi nếu còn limitation hoặc việc người dùng thực sự cần biết.

### Git

Đề xuất commit message nếu phù hợp.

Nguyên tắc cuối cùng:

> Code tốt không phải code trông phức tạp nhất.
> Hãy tạo giải pháp nhỏ nhất nhưng vẫn đúng, nhanh, dễ hiểu, dễ test và dễ bảo trì.
