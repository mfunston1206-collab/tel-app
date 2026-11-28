/* TEL guided tour — a step-by-step walkthrough that points at each part of the app.
   Role-aware (shows only what this person's tabs allow), Vietnamese/English, restartable from the "Hướng dẫn" button.
   It only explains and switches tabs; it never saves or changes data. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const L=()=>{ try{ return localStorage.getItem("tel_lang")==="en"?"en":"vi"; }catch(e){ return "vi"; } };
const store={ get(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } },
              set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const uid=()=>{ try{ return (window.TELuserId&&window.TELuserId())||"me"; }catch(e){ return "me"; } };
const has=t=>!!document.getElementById("tab-"+t);
function role(){ if(has("set")) return "ceo"; if(has("pay")&&has("ppl")) return "manager"; if(has("mypay")) return "teacher"; if(has("cls")) return "reception"; return ""; }
const SITE=location.origin.startsWith("http")?location.origin:"";

/* ---------- content ----------
   Each step: tab (switches to it; step skipped if this role lacks the tab), el (what to point at),
   only (roles), opt (skip if not on screen), vi/en: [title, body] or a function(role) returning one. */
const R={vi:{ceo:"CEO",manager:"Quản lý",reception:"Lễ tân",teacher:"Giáo viên"},en:{ceo:"CEO",manager:"Manager",reception:"Reception",teacher:"Teacher"}};
const CH=[
{id:"start", need:null, vi:"Làm quen với app", en:"Getting around", steps:[
 {vi:["Chào mừng đến TEL Điểm danh & Lương","Hướng dẫn này đi qua từng phần của app mà bạn được dùng. Bấm <b>Tiếp</b> để đi tiếp, <b>Quay lại</b> để xem lại bước trước.<br><br>Hướng dẫn chỉ giải thích, không lưu hay thay đổi dữ liệu. Bạn có thể đóng bất cứ lúc nào và mở lại bằng nút <b>Hướng dẫn</b> ở đầu trang."],
  en:["Welcome to TEL Attendance & Pay","This guide walks through each part of the app you can use. Press <b>Next</b> to move on and <b>Back</b> to see the previous step again.<br><br>The guide only explains; it never saves or changes anything. Close it any time and reopen it with the <b>Guide</b> button at the top of the page."]},
 {el:".lang", vi:["Tiếng Việt / English","Đổi ngôn ngữ của cả app, kể cả hướng dẫn này. Máy này sẽ nhớ lựa chọn của bạn."],
  en:["Tiếng Việt / English","Switches the whole app, this guide included, between Vietnamese and English. This device remembers your choice."]},
 {el:"#tabs", vi:r=>["Các mục của bạn","Mỗi mục là một phần việc. Bạn đang dùng vai trò <b>"+R.vi[r]+"</b>, nên chỉ thấy các mục dành cho vai trò này.<br><br>"+({
    ceo:"CEO thấy và sửa được mọi thứ, kể cả mốc lương và cài đặt.",
    manager:"Quản lý thấy giờ dạy và lương của mọi người, nhưng không sửa được mốc lương và cài đặt.",
    reception:"Lễ tân quản lý lớp, học viên, học phí và video bù. Lễ tân không thấy lương.",
    teacher:"Giáo viên chỉ thấy lớp và phiếu lương của chính mình, không thấy của người khác."})[r]],
  en:r=>["Your tabs","Each tab is one area of work. You're signed in as <b>"+R.en[r]+"</b>, so you only see the tabs for that role.<br><br>"+({
    ceo:"The CEO can see and change everything, including pay rates and settings.",
    manager:"The manager sees everyone's hours and pay but can't change pay rates or settings.",
    reception:"Reception manages classes, students, tuition and make-up videos. Reception can't see pay.",
    teacher:"Teachers only see their own classes and their own payslip, never anyone else's."})[r]]},
 {el:".who", vi:["Tài khoản & kết nối","Tên của bạn và trạng thái kết nối. <b>Đã đồng bộ</b> nghĩa là mọi thay đổi được lưu ngay lên máy chủ và hiện cho người khác sau vài giây.<br><br>Nếu thấy <b>Lỗi đồng bộ</b> hoặc <b>Ngoại tuyến</b>, kiểm tra mạng rồi tải lại trang."],
  en:["Account & connection","Your name and connection status. <b>Synced</b> means every change is saved to the server straight away and appears for everyone else within seconds.<br><br>If you see <b>Sync error</b> or <b>Offline</b>, check the internet connection and reload the page."]},
 {el:"#telSignOut", opt:1, vi:["Đăng xuất","Nếu dùng máy chung ở trung tâm, nhớ đăng xuất khi xong việc để người sau không dùng tài khoản của bạn."],
  en:["Sign out","On a shared computer at the centre, sign out when you finish so the next person can't use your account."]},
 {vi:["Dùng trên điện thoại","Mở địa chỉ app bằng <b>Chrome</b> (Android) hoặc <b>Safari</b> (iPhone), rồi chọn <b>Thêm vào màn hình chính</b> (Add to Home Screen). App sẽ có biểu tượng riêng như một ứng dụng bình thường."+(SITE?"<br><br>Địa chỉ app: <b class='tt-mono'>"+SITE+"</b>":"")],
  en:["Using it on a phone","Open the app's address in <b>Chrome</b> (Android) or <b>Safari</b> (iPhone) and choose <b>Add to Home Screen</b>. The app then gets its own icon like any other app."+(SITE?"<br><br>App address: <b class='tt-mono'>"+SITE+"</b>":"")]},
 {el:"#telTourBtn", vi:["Mở lại hướng dẫn","Bấm đây bất cứ lúc nào để xem lại cả hướng dẫn hoặc chỉ một phần, ví dụ chỉ phần <b>Điểm danh</b>."],
  en:["Open the guide again","Press here any time to replay the whole guide or just one part, for example only <b>Attendance</b>."]}
]},

{id:"setup", need:"cls", vi:"Nhập dữ liệu lần đầu", en:"Loading your data", steps:[
 {vi:r=>["Nên làm theo thứ tự này","Mỗi bước dùng dữ liệu của bước trước, nên hãy làm lần lượt:<ol><li>Giáo viên & mốc lương"+(r==="ceo"?"":" (CEO)")+"</li><li>Ngày lễ, ngày trung tâm nghỉ</li><li>Lớp học & danh sách học viên</li><li>Điểm danh cũ từ Google Sheets</li><li>Hồ sơ & học phí học viên</li><li>Mời nhân viên & phân quyền"+(r==="reception"?" (CEO/quản lý)":"")+"</li></ol>Các bước sau chỉ cho bạn chỗ làm từng việc."],
  en:r=>["Work in this order","Each step uses data from the one before, so go in order:<ol><li>Teachers & pay rates"+(r==="ceo"?"":" (CEO)")+"</li><li>Holidays and days the centre is closed</li><li>Classes & student lists</li><li>Past attendance from Google Sheets</li><li>Student profiles & tuition</li><li>Invite staff & assign roles"+(r==="reception"?" (CEO/manager)":"")+"</li></ol>The next steps show you where to do each one."]},
 {tab:"tch", el:"#rateTable", only:["ceo"], vi:["1. Giáo viên & mốc lương","Giáo viên từ bảng lương cũ đã có sẵn ở đây. Chọn cấp lương cho từng người. Người mới: nhập tên ở ô <b>Thêm giáo viên</b> bên dưới, chọn GV Việt hoặc GV nước ngoài."],
  en:["1. Teachers & pay rates","Teachers from the old payroll are already here. Choose each person's pay grade. For someone new, type their name under <b>Add teacher</b> below and choose Vietnamese or foreign teacher."]},
 {tab:"cls", el:"#holCard", vi:["2. Ngày lễ","Thêm Tết và các ngày trung tâm nghỉ <b>trước</b> khi tạo lớp. Lịch học tự bỏ qua những ngày này và lùi ngày kết khoá."],
  en:["2. Holidays","Add Tết and other days the centre is closed <b>before</b> creating classes. Schedules skip these days automatically and push the course end date back."]},
 {tab:"cls", el:"#clsForm", vi:["3. Tạo lớp","Điền tên lớp, giáo viên phụ trách, loại lớp, ngày khai giảng, số buổi và lịch học (tick thứ, điền giờ). Dán danh sách học viên, <b>mỗi dòng một tên</b>. Lớp kèm thì chọn thêm gói học phí.<br><br>Bấm <b>Lưu lớp</b>. Ngày kết khoá tự tính."],
  en:["3. Create a class","Fill in the class name, teacher in charge, class type, start date, number of lessons and the schedule (tick the days, enter the times). Paste the student list, <b>one name per line</b>. For tutoring, also choose the tuition package.<br><br>Press <b>Save class</b>. The end date is worked out for you."]},
 {tab:"cls", el:"#impCard", vi:["4. Điểm danh cũ từ Google Sheets","<ol><li>Ở ô <b>Nhập vào lớp</b>, chọn lớp vừa tạo.</li><li>Mở sheet điểm danh của giáo viên, bấm <b>Ctrl+A</b> rồi <b>Ctrl+C</b> (điện thoại: chọn hết ô, Sao chép).</li><li>Dán vào ô <b>Dữ liệu dán từ sheet</b>.</li><li>Bấm <b>Đọc dữ liệu</b>, kiểm tra bảng xem trước, rồi bấm <b>Lưu … buổi</b>.</li></ol>Lớp kèm có buổi cũ lệch lịch: bấm <b>Lịch linh hoạt trước hôm nay</b> để các buổi trước hôm nay không còn hiện “chưa điểm danh”."],
  en:["4. Past attendance from Google Sheets","<ol><li>Under <b>Import into class</b>, choose the class you just created.</li><li>Open the teacher's attendance sheet and press <b>Ctrl+A</b>, then <b>Ctrl+C</b> (on a phone: select all cells, Copy).</li><li>Paste into <b>Data pasted from the sheet</b>.</li><li>Press <b>Read data</b>, check the preview table, then press <b>Save … lessons</b>.</li></ol>If a tutoring class's past lessons didn't follow its schedule, press <b>Flexible schedule before today</b> so earlier lessons stop showing as “not marked”."]},
 {tab:"stu", el:"#stuMigrate", opt:1, vi:["5. Tạo hồ sơ học viên","Thanh này cho biết có bao nhiêu học viên trong các lớp chưa có hồ sơ. Bấm <b>Tạo hồ sơ</b> để tạo cho tất cả cùng lúc."],
  en:["5. Create student profiles","This bar shows how many students in your classes don't have a profile yet. Press <b>Create profiles</b> to make them all at once."]},
 {tab:"stu", el:"#stuTable", vi:["5. Ghi học phí đã đóng","Bấm vào từng học viên, rồi bấm <b>Thu học phí</b> và nhập số tiền và số buổi đã đóng. App tự tính số buổi còn lại và đóng đến ngày nào."],
  en:["5. Record tuition already paid","Open each student, press <b>Collect tuition</b>, and enter the amount and number of lessons paid. The app works out the lessons left and the paid-until date."]},
 {tab:"ppl", el:"#pplTable", vi:["6. Mời nhân viên","Gửi địa chỉ app cho từng người"+(SITE?" (<b class='tt-mono'>"+SITE+"</b>)":"")+". Họ bấm <b>Tạo tài khoản</b> bằng email của mình.<br><br>Sau lần đăng nhập đầu, họ hiện ở bảng này. Chọn vai trò; với giáo viên, chọn thêm đúng tên giáo viên."],
  en:["6. Invite staff","Send each person the app's address"+(SITE?" (<b class='tt-mono'>"+SITE+"</b>)":"")+". They press <b>Create account</b> with their own email.<br><br>After their first sign-in they appear in this table. Choose their role, and for teachers also pick their teacher name."]},
 {tab:"set", el:"#telBackupBtn", only:["ceo"], vi:["Sao lưu khi nhập xong","Nhập xong dữ liệu thì bấm <b>Tải file sao lưu</b> và cất file vào Google Drive. Nên làm việc này mỗi tuần."],
  en:["Back up when you're done","Once your data is in, press <b>Download backup file</b> and keep the file in Google Drive. Do this every week."]}
]},

{id:"att", need:"att", vi:"Điểm danh hằng ngày", en:"Daily attendance", steps:[
 {tab:"att", el:"#a-class", vi:r=>["Chọn lớp","Chọn lớp cần điểm danh ở đây."+(r==="teacher"?"<br><br>Ô <b>Chỉ lớp của tôi</b> đang bật nên chỉ hiện lớp của bạn. Khi dạy thay, bỏ tick ô này để thấy lớp khác.":"")],
  en:r=>["Choose a class","Choose the class to mark here."+(r==="teacher"?"<br><br><b>Only my classes</b> is ticked, so you only see your own classes. When covering for someone, untick it to see other classes.":"")]},
 {tab:"att", el:"#a-head", vi:["Thông tin lớp","Số buổi đã dạy trên tổng số buổi, ngày khai giảng, ngày dự kiến kết khoá và số buổi <b>chưa điểm danh</b>. Số màu đỏ nghĩa là có buổi đã qua mà chưa ai điểm danh."],
  en:["Class overview","Lessons taught out of the total, the start date, the expected end date and the number of lessons <b>not marked</b>. A red number means a past lesson still hasn't been marked."]},
 {tab:"att", el:"#a-sched", vi:["Lịch các buổi","Mỗi dòng là một buổi; buổi hôm nay được tô nổi bật. <b>Bấm vào một buổi</b> để mở bảng điểm danh. Ngày lễ và buổi đã dời hiện màu nhạt."],
  en:["Lesson list","Each row is one lesson, and today's lesson is highlighted. <b>Tap a lesson</b> to open its attendance form. Holidays and moved lessons are greyed out."]},
 {tab:"att", el:"#a-sched", vi:["Điểm danh một buổi","Trong bảng điểm danh:<ol><li>Chọn <b>Có dạy</b> (hoặc <b>Lớp nghỉ</b>; lớp kèm có thêm <b>Học viên nghỉ</b>).</li><li>Chọn ai dạy: GV phụ trách hoặc <b>GV khác dạy thay</b>.</li><li>Điền Unit, nội dung, giờ bắt đầu và kết thúc.</li><li>Mỗi học viên: <b>✓</b> có mặt, <b>P</b> vắng có phép, <b>A</b> vắng không phép; tick <b>☑ Làm BT</b> nếu đã làm bài tập (có nút <b>Tất cả có mặt</b> / <b>Tất cả làm BT</b>).</li><li>Ô dưới mỗi tên: ghi chú riêng cho học viên đó trong buổi này.</li><li>Dạy xong, tick <b>Đã hoàn thành buổi dạy</b> rồi bấm <b>Lưu</b>. Có thể lưu điểm danh lúc đầu giờ và tick hoàn thành lúc cuối giờ.</li></ol>"],
  en:["Marking a lesson","In the attendance form:<ol><li>Choose <b>Taught</b> (or <b>Class off</b>; tutoring classes also have <b>Student absent</b>).</li><li>Choose who taught: the teacher in charge or <b>Another teacher covers</b>.</li><li>Fill in the unit, content, start and end times.</li><li>For each student: <b>✓</b> present, <b>P</b> absent with permission, <b>A</b> absent without permission; tick <b>☑ Homework</b> if they did it (or use <b>All present</b> / <b>All did homework</b>).</li><li>The box under each name is a note for that student in this lesson.</li><li>When the lesson is over, tick <b>Lesson completed</b> and press <b>Save</b>. You can save attendance at the start and tick completed at the end.</li></ol>"]},
 {vi:r=>["Sau khi lưu","Buổi đã lưu được tính vào giờ dạy và lương của người dạy. Nếu có học viên vắng, app nhắc gửi video bài học, và tên học viên hiện ở mục <b>Video bù</b> cho lễ tân."+(r==="teacher"?"<br><br><b>Lưu ý:</b> giáo viên chỉ điểm danh được <b>trong ngày học</b>. Quên điểm danh hoặc cần sửa buổi cũ thì báo lễ tân hoặc quản lý.":"<br><br>Giáo viên chỉ điểm danh được trong ngày học; buổi cũ cần sửa thì lễ tân, quản lý hoặc CEO sửa giúp.")],
  en:r=>["After saving","A saved lesson counts toward the teacher's hours and pay. If students were absent, the app reminds you to send the lesson video, and their names appear under <b>Make-up videos</b> for reception."+(r==="teacher"?"<br><br><b>Note:</b> teachers can only mark attendance <b>on the lesson day</b>. If you forgot, or an old lesson needs fixing, tell reception or the manager.":"<br><br>Teachers can only mark on the lesson day; reception, the manager or the CEO fix older lessons for them.")]},
 {tab:"att", el:"#a-head .actions", opt:1, vi:r=>["Khi lịch thay đổi (lớp kèm)","<b>Hôm nay có dạy</b>: hôm nay có buổi nhưng không nằm trong lịch.<br><b>+ Buổi ngoài lịch</b>: thêm buổi dạy bù vào một ngày khác.<br><b>Đổi lịch cố định</b>: lịch tuần đổi từ một ngày trở đi.<br>Trong danh sách buổi, nút <b>Dời</b> chuyển một buổi sang ngày khác."+(r==="teacher"?"":"<br><b>Đổi GV phụ trách</b>: lớp chuyển cho giáo viên khác từ một ngày trở đi.")],
  en:r=>["When the schedule changes (tutoring)","<b>Taught today</b>: there was a lesson today that isn't on the schedule.<br><b>+ Off-schedule lesson</b>: add a make-up lesson on another day.<br><b>Change fixed schedule</b>: the weekly schedule changes from a given date.<br>In the lesson list, <b>Move</b> shifts one lesson to another day."+(r==="teacher"?"":"<br><b>Change teacher in charge</b>: the class passes to another teacher from a given date.")]}
]},

{id:"vid", need:"vid", vi:"Video bù cho học viên vắng", en:"Make-up videos", steps:[
 {tab:"vid", el:"#panel-vid .card", vi:["Video cho học viên vắng","Học viên vắng hiện ở đây ngay khi giáo viên lưu điểm danh. Gửi video bài học cho phụ huynh qua Zalo, rồi bấm <b>Đã gửi video</b>. App ghi lại ai gửi và giờ gửi.<br><br>Dùng ô lọc phía trên để xem tháng khác, hoặc các video đã gửi."],
  en:["Videos for absent students","Absent students appear here as soon as the teacher saves attendance. Send the lesson video to the parent on Zalo, then press <b>Video sent</b>. The app records who sent it and when.<br><br>Use the filters at the top to see another month or videos already sent."]}
]},

{id:"cls", need:"cls", vi:"Lớp học & nhập dữ liệu", en:"Classes & importing", steps:[
 {tab:"cls", el:"#clsForm", vi:["Thêm lớp","Điền thông tin lớp, lịch học và danh sách học viên (mỗi dòng một tên), rồi bấm <b>Lưu lớp</b>. Học phí và số buổi ở đây được dùng sẵn khi thu học phí và trong tin nhắn nhắc phụ huynh."],
  en:["Add a class","Fill in the class details, schedule and student list (one name per line), then press <b>Save class</b>. The tuition and lesson count you enter here are used when collecting fees and in reminder messages to parents."]},
 {tab:"cls", el:"#clsTable", vi:["Danh sách lớp","Bấm <b>Sửa</b> để đổi lịch, học viên hoặc giáo viên; thông tin hiện lại ở form phía trên. Khi lớp kết thúc, bỏ tick <b>Lớp đang học</b>: lớp không còn hiện ở Điểm danh nhưng dữ liệu vẫn được giữ."],
  en:["Class list","Press <b>Edit</b> to change a class's schedule, students or teacher; its details load into the form above. When a class finishes, untick <b>Active classes</b> in its form: it disappears from Attendance, but its records are kept."]},
 {tab:"cls", el:"#impCard", vi:["Nhập điểm danh từ Google Sheets","Chọn lớp, dán toàn bộ sheet (Ctrl+A, Ctrl+C, rồi Ctrl+V), bấm <b>Đọc dữ liệu</b>, kiểm tra rồi bấm <b>Lưu</b>. App đọc được sheet lớp kèm (cột UNIT, LESSON, DATE, TIME, DURATION) và sheet lớp đông (DAY 1, DAY 2… và tên học viên).<br><br>Chỉ tick <b>Ghi đè</b> khi muốn thay các buổi đã có trong app bằng dữ liệu từ sheet."],
  en:["Import attendance from Google Sheets","Choose the class, paste the whole sheet (Ctrl+A, Ctrl+C, then Ctrl+V), press <b>Read data</b>, check it and press <b>Save</b>. The app reads tutoring sheets (UNIT, LESSON, DATE, TIME, DURATION columns) and group-class sheets (DAY 1, DAY 2… and student names).<br><br>Only tick <b>Overwrite</b> if you want the sheet to replace lessons already in the app."]},
 {tab:"cls", el:"#holCard", vi:["Ngày lễ","Thêm ngày nghỉ ở đây; mọi lớp tự bỏ qua những ngày này và tính lại ngày kết khoá."],
  en:["Holidays","Add days off here; every class skips them and recalculates its end date."]}
]},

{id:"stu", need:"stu", vi:"Học viên & học phí", en:"Students & tuition", steps:[
 {tab:"stu", el:"#remCard", vi:["Nhắc học phí","Danh sách học viên sắp hết buổi đã đóng (đổi ngưỡng ở ô <b>Báo khi còn ≤</b>) hoặc còn nợ. Bấm <b>Tin nhắn Zalo</b> để chép sẵn tin nhắn nhắc phụ huynh, rồi dán vào Zalo."],
  en:["Tuition reminders","Students who are running out of paid lessons (set the limit with <b>Alert at ≤</b>) or who still owe money. Press <b>Zalo message</b> to copy a ready-made reminder for the parent, then paste it into Zalo."]},
 {tab:"stu", el:"#st-q", vi:["Tìm & lọc","Tìm theo tên, số điện thoại hoặc tên phụ huynh. Ô <b>Hiện</b> bên cạnh lọc học viên đang học, bảo lưu, đã nghỉ, chưa ghi học phí hoặc còn nợ."],
  en:["Search & filter","Search by name, phone number or parent's name. The <b>Show</b> box next to it filters students who are active, paused, left, have no tuition recorded, or owe money."]},
 {tab:"stu", el:"#stuTable", vi:["Hồ sơ học viên","Bấm vào một học viên để mở hồ sơ: thông tin liên lạc, các lớp, số buổi đã học và đã đóng, đóng đến ngày nào, chuyên cần và bài tập."],
  en:["Student profile","Tap a student to open their profile: contact details, classes, lessons attended and paid for, the paid-until date, attendance and homework."]},
 {tab:"stu", el:"#stuTable", vi:r=>["Thu học phí & phiếu thu","Trong hồ sơ, bấm <b>Thu học phí</b>, nhập số tiền và số buổi. Bấm <b>Phiếu thu</b> để xem và chép phiếu gửi phụ huynh. Đóng thiếu thì bấm <b>Thu thêm</b> khi phụ huynh đóng nốt."+(r==="ceo"?" Chỉ CEO huỷ được phiếu thu.":"")],
  en:r=>["Collecting tuition & receipts","In the profile, press <b>Collect tuition</b> and enter the amount and number of lessons. Press <b>Receipt</b> to view and copy a receipt for the parent. If they paid part, press <b>Collect more</b> when they pay the rest."+(r==="ceo"?" Only the CEO can cancel a receipt.":"")]},
 {tab:"stu", el:"#stuTable", vi:["Bảo lưu, nghỉ, chuyển lớp","Dùng các nút <b>Bảo lưu</b>, <b>Nghỉ học</b>, <b>Chuyển lớp</b> và <b>Học lại</b> trong hồ sơ. Khi chuyển lớp, số buổi đã đóng được chuyển theo sang lớp mới."],
  en:["Pause, leave, change class","Use <b>Paused</b>, <b>Leave class</b>, <b>Change class</b> and <b>Return</b> in the profile. When a student changes class, their paid lessons move with them."]},
 {tab:"stu", el:"#stuAddBtn", vi:["Thêm học viên mới","Bấm đây để thêm một học viên mới, rồi thêm vào lớp và ghi học phí."],
  en:["Add a new student","Press here to add a new student, then put them in a class and record their tuition."]}
]},

{id:"sum", need:"sum", vi:"Tổng kết tháng", en:"Monthly summary", steps:[
 {tab:"sum", el:"#s-month", vi:["Chọn tháng","Chọn tháng cần xem."], en:["Choose a month","Choose the month to view."]},
 {tab:"sum", el:"#s-table", vi:r=>["Tổng kết",r==="teacher"?"Số buổi và giờ bạn đã dạy trong tháng, kể cả buổi dạy thay. Dùng để đối chiếu với phiếu lương.":"Số buổi, giờ dạy, buổi dạy thay và được dạy thay của từng giáo viên trong tháng. Kiểm tra ở đây trước khi làm lương."],
  en:r=>["Summary",r==="teacher"?"The lessons and hours you taught this month, including covers. Use it to check your payslip.":"Each teacher's lessons, hours, covers given and covers received this month. Check this before running payroll."]}
]},

{id:"tch", need:"tch", vi:"Giáo viên & mốc lương", en:"Teachers & pay rates", steps:[
 {tab:"tch", el:"#rateTable", vi:r=>["Mốc lương từng giáo viên",r==="ceo"?"Chọn cấp cho từng giáo viên: số màu xám lấy từ khung lương. Gõ số vào ô để đặt mức riêng cho người đó, rồi bấm <b>Lưu thay đổi</b> ở cuối màn hình.":"Cấp và mức lương của từng giáo viên. Chỉ CEO đổi được mốc lương."],
  en:r=>["Each teacher's pay",r==="ceo"?"Choose each teacher's grade; grey numbers come from the pay scale. Type a number in a box to set a personal rate for that teacher, then press <b>Save changes</b> at the bottom of the screen.":"Each teacher's grade and pay rate. Only the CEO can change pay rates."]},
 {tab:"tch", el:"#tForm", vi:["Thêm giáo viên","Nhập tên, chọn GV Việt hoặc GV nước ngoài, rồi bấm <b>Thêm</b>. Sau đó nối giáo viên với tài khoản của họ ở mục <b>Phân quyền</b>."],
  en:["Add a teacher","Type the name, choose Vietnamese or foreign teacher and press <b>Add</b>. Then link the teacher to their account under <b>Roles</b>."]},
 {tab:"tch", el:"#scaleTable", vi:["Khung lương","Mức lương theo cấp, theo “Cơ chế lương giáo viên”. GV nước ngoài: 550.000 cho 90 phút."],
  en:["Pay scale","Rates by grade, from the “Teacher pay scheme”. Foreign teachers: 550,000 per 90 minutes."]}
]},

{id:"pay", need:"pay", vi:"Làm lương", en:"Running payroll", steps:[
 {tab:"pay", el:"#p-month", vi:["Chọn tháng lương","Lương được tính tự động từ các buổi đã điểm danh trong tháng."],
  en:["Choose the pay month","Pay is calculated automatically from the lessons marked that month."]},
 {tab:"pay", el:"#p-warn", opt:1, vi:["Cảnh báo","Nếu còn buổi chưa điểm danh hoặc thiếu thông tin, app báo ở đây. Xử lý xong rồi mới trả lương."],
  en:["Warnings","If lessons are still unmarked or details are missing, the app flags them here. Sort these out before paying."]},
 {tab:"pay", el:"#p-table", vi:["Bảng lương","Mỗi dòng là một giáo viên: số buổi, lương, khấu trừ và thực trả. Bấm vào tên ở dưới bảng để xem từng buổi. Chuyển khoản xong thì bấm <b>Đã trả hôm nay</b>."],
  en:["Payroll table","One row per teacher: lessons, pay, deductions and take-home. Tap a name below the table to see every lesson. After paying, press <b>Paid today</b>."]},
 {tab:"pay", el:"#bForm", vi:["Thưởng","App tự gợi ý thưởng kết khoá, tái phí…; bấm <b>Thêm tất cả</b> hoặc thêm từng khoản. Thưởng khác: chọn giáo viên, loại thưởng, số lượng rồi bấm <b>Thêm thưởng</b>."],
  en:["Bonuses","The app suggests bonuses (course end, re-enrolment…); press <b>Add all</b> or add them one by one. For other bonuses, choose the teacher, bonus type and quantity, then press <b>Add bonus</b>."]},
 {tab:"pay", el:"#p-send", vi:["Gửi phiếu lương","Kiểm tra xong thì bấm nút này. Mỗi giáo viên thấy phiếu của mình ở mục <b>Lương của tôi</b> và không thấy phiếu của người khác. Nếu sửa gì sau khi gửi, bấm gửi lại."],
  en:["Send payslips","Once everything is checked, press this. Each teacher sees their own payslip under <b>My pay</b> and never anyone else's. If you change anything after sending, send again."]},
 {tab:"pay", el:"#p-xlsx", vi:["Tải bảng lương","<b>Tải bảng lương Excel</b> để lưu hoặc in. Nút bên cạnh tạo file cho chương trình English Lovers Payroll trên máy tính."],
  en:["Download payroll","<b>Download payroll (Excel)</b> to keep or print it. The button next to it makes a file for the English Lovers Payroll program on the computer."]}
]},

{id:"mypay", need:"mypay", vi:"Lương của tôi", en:"My pay", steps:[
 {tab:"mypay", el:"#panel-mypay .card", vi:["Phiếu lương của bạn","Phiếu lương hiện ở đây sau khi CEO hoặc quản lý kiểm tra và gửi: từng buổi đã dạy, mức lương, thưởng và số thực nhận. Chỉ bạn thấy phiếu này.<br><br>Thấy chỗ nào chưa đúng thì báo quản lý."],
  en:["Your payslip","Your payslip appears here once the CEO or manager has checked and sent it: every lesson you taught, your rate, bonuses and take-home pay. Only you can see it.<br><br>If something looks wrong, tell the manager."]}
]},

{id:"ppl", need:"ppl", vi:"Phân quyền nhân viên", en:"Staff roles", steps:[
 {tab:"ppl", el:"#pplTable", vi:["Phân quyền","Người mới tạo tài khoản hiện ở đây. Chọn vai trò <b>Quản lý</b>, <b>Lễ tân</b> hoặc <b>Giáo viên</b>. Giáo viên phải được nối với đúng tên giáo viên thì mới thấy lớp của mình. Người chưa được phân quyền chỉ thấy màn hình chờ.<br><br>Chọn xong, bấm <b>Lưu thay đổi</b> ở cuối màn hình. Ô nào đổi mà chưa lưu sẽ có viền cam."],
  en:["Assigning roles","New accounts appear here. Choose <b>Manager</b>, <b>Reception</b> or <b>Teacher</b>. Teachers must be linked to the right teacher name before they can see their classes. Anyone without a role only sees a waiting screen.<br><br>When you're done, press <b>Save changes</b> at the bottom of the screen. Boxes changed but not yet saved have an orange outline."]},
 {tab:"ppl", el:"#pplTable", vi:["Khi nhân viên nghỉ việc","Đặt vai trò về <b>— Chưa phân —</b>. Người đó vẫn đăng nhập được nhưng không còn thấy dữ liệu nào. Dữ liệu cũ (buổi dạy, lương) vẫn được giữ."],
  en:["When someone leaves","Set their role back to <b>— Unassigned —</b>. They can still sign in but see no data at all. Their past lessons and pay are kept."]}
]},

{id:"set", need:"set", vi:"Cài đặt & sao lưu", en:"Settings & backup", steps:[
 {tab:"set", el:"#setForm", vi:["Cài đặt lương","Các quy tắc tính lương chung: khấu trừ, dạy cùng GVNN, học viên kèm nghỉ, chênh lệch lớp online, phụ phí yêu cầu riêng. Chỉ CEO thấy và đổi được."],
  en:["Pay settings","The rules behind every payslip: deductions, co-teaching with foreign teachers, tutoring absences, online-class difference and the special-request extra. Only the CEO can see and change them."]},
 {tab:"set", el:"#telBackupBtn", vi:["Sao lưu mỗi tuần","Tải một file chứa toàn bộ dữ liệu TEL. Cất file vào Google Drive. Gói miễn phí của máy chủ không tự sao lưu, nên đây là bản dự phòng của bạn."],
  en:["Back up every week","Downloads one file with all of TEL's data. Keep it in Google Drive. The server's free plan doesn't make backups, so this file is your safety copy."]}
]}
];

/* ---------- UI ---------- */
const css=`
#tt-block{position:fixed;inset:0;z-index:9998;background:transparent}
#tt-spot{position:fixed;z-index:9999;border-radius:10px;pointer-events:none;box-shadow:0 0 0 3px var(--accent,#B0365A),0 0 0 9999px rgba(20,20,31,.55);transition:all .18s ease}
#tt-spot.center{box-shadow:0 0 0 9999px rgba(20,20,31,.55);width:0!important;height:0!important}
#tt-pop{position:fixed;z-index:10000;width:min(380px,calc(100vw - 24px));background:var(--surface,#fff);color:var(--ink,#1E1F33);border:1px solid var(--line,#DEDDE7);border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.28);padding:16px 18px;display:grid;gap:10px;font-family:var(--body,system-ui,sans-serif);max-height:calc(100vh - 24px);overflow:auto}
#tt-pop h3{margin:0;font-size:16.5px;font-weight:700;text-wrap:balance}
#tt-pop .tt-body{font-size:14.5px;line-height:1.5}
#tt-pop .tt-body ol{margin:6px 0;padding-left:20px;display:grid;gap:3px}
#tt-pop .tt-k{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--accent,#B0365A)}
#tt-pop .tt-row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
#tt-pop .tt-dots{display:flex;gap:4px;flex-wrap:wrap}
#tt-pop .tt-dots i{width:6px;height:6px;border-radius:50%;background:var(--line,#DEDDE7)}
#tt-pop .tt-dots i.on{background:var(--accent,#B0365A)}
#tt-pop .tt-mono{font-family:var(--mono,monospace);font-size:13px;word-break:break-all}
#tt-pop .tt-lg{display:inline-flex;border:1px solid var(--line,#DEDDE7);border-radius:999px;overflow:hidden;justify-self:start}
#tt-pop .tt-lg button{font:600 12px var(--body,system-ui);border:0;background:transparent;color:var(--muted,#64667B);padding:4px 10px;cursor:pointer}
#tt-pop .tt-lg button[aria-pressed="true"]{background:var(--ink,#1E1F33);color:var(--bg,#fff)}
#tt-pop .tt-x{position:absolute;top:8px;right:8px;border:0;background:transparent;color:var(--muted,#64667B);font-size:20px;line-height:1;padding:6px 8px;cursor:pointer;border-radius:8px}
#tt-pop.menu{left:50%!important;top:50%!important;transform:translate(-50%,-50%);width:min(460px,calc(100vw - 24px))}
#tt-pop .tt-list{display:grid;gap:6px;margin:0;padding:0;list-style:none}
#tt-pop .tt-list button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;font:500 14.5px var(--body,system-ui);color:var(--ink,#1E1F33);background:var(--bg,#F5F4F7);border:1px solid var(--line,#DEDDE7);border-radius:10px;padding:10px 12px;cursor:pointer}
#tt-pop .tt-list button:hover{border-color:var(--accent,#B0365A)}
#tt-pop .tt-list .n{color:var(--muted,#64667B);font-size:12.5px;white-space:nowrap}
#tt-pop .tt-list .ok{color:var(--ok,#1F7A4D);font-weight:700}
@media (max-width:640px){ #tt-pop:not(.menu){left:8px!important;right:8px!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:auto;max-height:52vh} }
@media (prefers-reduced-motion:reduce){#tt-spot{transition:none}}
`;
const UI={vi:{guide:"Hướng dẫn",next:"Tiếp",back:"Quay lại",done:"Xong",close:"Đóng hướng dẫn",menuT:"Hướng dẫn sử dụng",menuB:r=>"Chọn một phần để xem, hoặc xem tất cả từ đầu. Bạn đang dùng vai trò <b>"+R.vi[r]+"</b>.",all:"Xem tất cả từ đầu",later:"Để sau",steps:n=>n+" bước",step:(i,n)=>"Bước "+i+"/"+n,finT:"Xong phần này",finB:"Bạn có thể mở lại bất cứ lúc nào bằng nút <b>Hướng dẫn</b> ở đầu trang.",toMenu:"Các phần khác",waitT:"Chờ phân quyền",waitB:"Tài khoản của bạn đã được tạo. Hãy báo CEO hoặc quản lý vào mục <b>Phân quyền</b> để chọn vai trò cho bạn. Sau đó trang tự mở các mục của bạn và hướng dẫn sẽ bắt đầu."},
          en:{guide:"Guide",next:"Next",back:"Back",done:"Done",close:"Close the guide",menuT:"How to use the app",menuB:r=>"Pick a part to view, or go through everything from the start. You're signed in as <b>"+R.en[r]+"</b>.",all:"Watch everything from the start",later:"Later",steps:n=>n+(n===1?" step":" steps"),step:(i,n)=>"Step "+i+" of "+n,finT:"Section finished",finB:"Reopen the guide any time with the <b>Guide</b> button at the top of the page.",toMenu:"Other sections",waitT:"Waiting for a role",waitB:"Your account has been created. Ask the CEO or manager to open <b>Roles</b> and choose a role for you. Your tabs will then open by themselves and the guide will start."}};
const LG=()=>`<span class="tt-lg" role="group" aria-label="Ngôn ngữ / Language"><button type="button" data-tt-lang="vi" aria-pressed="${L()==="vi"}">Tiếng Việt</button><button type="button" data-tt-lang="en" aria-pressed="${L()==="en"}">English</button></span>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

let st=null; // {queue:[{ch,step}], i, back:tab}
let els=null;
function mount(){ if(els) return els;
  const sty=document.createElement("style"); sty.textContent=css; document.head.appendChild(sty);
  const block=document.createElement("div"); block.id="tt-block";
  const spot=document.createElement("div"); spot.id="tt-spot";
  const pop=document.createElement("div"); pop.id="tt-pop"; pop.setAttribute("role","dialog"); pop.setAttribute("aria-modal","true"); pop.setAttribute("aria-labelledby","tt-h"); pop.setAttribute("data-noi18n","");
  block.setAttribute("data-noi18n","");
  block.addEventListener("click",()=>{ const b=pop.querySelector("[data-tt-next],[data-tt-all]"); if(b) b.focus(); });
  pop.addEventListener("click",onClick);
  els={block,spot,pop}; return els; }
function open(){ mount(); [els.block,els.spot,els.pop].forEach(e=>{ if(!e.isConnected) document.body.appendChild(e); }); document.addEventListener("keydown",onKey,true); addEventListener("resize",place); addEventListener("scroll",place,true); }
function close(){ if(!els) return; [els.block,els.spot,els.pop].forEach(e=>e.remove()); document.removeEventListener("keydown",onKey,true); removeEventListener("resize",place); removeEventListener("scroll",place,true);
  if(st&&st.back){ const b=document.getElementById("tab-"+st.back); if(b&&b.getAttribute("aria-selected")!=="true") b.click(); }
  st=null; const t=$("#telTourBtn"); if(t) t.focus(); }
function onKey(e){ if(!els||!els.pop.isConnected) return;
  if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); close(); }
  else if(st&&st.queue&&e.key==="ArrowRight"){ e.preventDefault(); go(1); }
  else if(st&&st.queue&&e.key==="ArrowLeft"){ e.preventDefault(); go(-1); }
  else if(e.key==="Tab"){ const f=[...els.pop.querySelectorAll("button")]; if(!f.length) return; const a=f[0], z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } else if(!els.pop.contains(document.activeElement)){ e.preventDefault(); a.focus(); } } }
function onClick(e){ const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.ttLang){ if(b.dataset.ttLang!==L()){ const a=document.querySelector('.lang [data-lang="'+b.dataset.ttLang+'"]'); if(a) a.click(); else { try{ localStorage.setItem("tel_lang",b.dataset.ttLang); }catch(e){} rerender(); } } return; }
  if(b.hasAttribute("data-tt-x")||b.hasAttribute("data-tt-later")) return close();
  if(b.hasAttribute("data-tt-next")) return go(1);
  if(b.hasAttribute("data-tt-back")) return go(-1);
  if(b.hasAttribute("data-tt-menu")) return menu();
  if(b.hasAttribute("data-tt-all")) return start(null);
  if(b.dataset.ttCh) return start(b.dataset.ttCh); }

function chapters(r){ return CH.filter(c=>!c.need||has(c.need)).map(c=>({c,steps:c.steps.filter(s=>(!s.tab||has(s.tab))&&(!s.only||s.only.includes(r)))})).filter(x=>x.steps.length); }
function doneSet(){ return store.get("tel_tour_done_"+uid())||[]; }
function markDone(id){ const d=doneSet(); if(!d.includes(id)){ d.push(id); store.set("tel_tour_done_"+uid(),d); } }
function curTab(){ const b=document.querySelector('#tabs [aria-selected="true"]'); return b?b.dataset.tab:""; }

function menu(){ const r=role(), l=L(), U=UI[l]; open();
  if(!r){ st={menu:1,back:st&&st.back}; els.spot.className="center"; els.pop.className="menu";
    els.pop.innerHTML=`<button class="tt-x" type="button" data-tt-x aria-label="${U.close}">×</button>${LG()}<h3 id="tt-h">${U.waitT}</h3><div class="tt-body">${U.waitB}</div><div class="tt-row"><span></span><button class="btn" type="button" data-tt-later>${U.done}</button></div>`;
    els.pop.querySelector("[data-tt-later]").focus(); return; }
  const back=st&&st.back||curTab(); st={menu:1,back}; const d=doneSet();
  els.spot.className="center"; els.pop.className="menu"; els.pop.style.cssText="";
  els.pop.innerHTML=`<button class="tt-x" type="button" data-tt-x aria-label="${U.close}">×</button>
    ${LG()}<h3 id="tt-h">${U.menuT}</h3><div class="tt-body">${U.menuB(r)}</div>
    <ul class="tt-list">${chapters(r).map((x,i)=>`<li><button type="button" data-tt-ch="${x.c.id}"><span>${i+1}. ${esc(x.c[l])}</span><span class="n">${d.includes(x.c.id)?'<span class="ok" aria-label="✓">✓</span> ':""}${U.steps(x.steps.length)}</span></button></li>`).join("")}</ul>
    <div class="tt-row"><button class="btn ghost" type="button" data-tt-later>${U.later}</button><button class="btn" type="button" data-tt-all>${U.all}</button></div>`;
  els.pop.querySelector("[data-tt-all]").focus(); }

function start(chId){ const r=role(); if(!r) return menu(); const back=st&&st.back||curTab();
  const q=[]; chapters(r).filter(x=>!chId||x.c.id===chId).forEach(x=>x.steps.forEach(s=>q.push({ch:x.c,step:s})));
  if(!q.length) return menu(); open(); st={queue:q,i:0,back,only:chId}; show(); }

function visible(el){ if(!el||el.closest("[hidden]")) return false; const r=el.getBoundingClientRect(); return r.width>0&&r.height>0; }
function go(d){ if(!st||!st.queue) return; let i=st.i+d;
  while(i>=0&&i<st.queue.length&&!usable(st.queue[i],d)) i+=d;
  if(i>=st.queue.length) return finish(); if(i<0) return; st.i=i; show(); }
function usable(q){ const s=q.step; if(!s.opt) return true; switchTab(s.tab); return visible(s.el&&$(s.el)); }
function switchTab(t){ if(!t) return; const b=document.getElementById("tab-"+t); if(b&&b.getAttribute("aria-selected")!=="true") b.click(); }
function finish(){ if(st.queue) st.queue.forEach(q=>markDone(q.ch.id)); const l=L(), U=UI[l]; st.queue=null; st.menu=1; st.fin=1;
  els.spot.className="center"; els.pop.className="menu"; els.pop.style.cssText="";
  els.pop.innerHTML=`<button class="tt-x" type="button" data-tt-x aria-label="${U.close}">×</button>${LG()}<h3 id="tt-h">${U.finT}</h3><div class="tt-body">${U.finB}</div><div class="tt-row"><button class="btn ghost" type="button" data-tt-menu>${U.toMenu}</button><button class="btn" type="button" data-tt-x>${U.done}</button></div>`;
  els.pop.querySelector("[data-tt-x].btn").focus(); }

function txt(s,l,r){ const v=s[l]; return typeof v==="function"?v(r):v; }
function show(){ const {ch,step:s}=st.queue[st.i], r=role(), l=L(), U=UI[l], [title,body]=txt(s,l,r);
  if(st.i===0&&s.opt&&!usable(st.queue[0])) return go(1);
  switchTab(s.tab);
  const inCh=st.queue.filter(q=>q.ch===ch), k=inCh.indexOf(st.queue[st.i]);
  const last=st.i===st.queue.length-1;
  els.pop.className="";
  els.pop.innerHTML=`<button class="tt-x" type="button" data-tt-x aria-label="${U.close}">×</button>
    ${LG()}<div class="tt-k">${esc(ch[l])} · ${U.step(k+1,inCh.length)}</div>
    <h3 id="tt-h">${title}</h3><div class="tt-body">${body}</div>
    <div class="tt-row"><span class="tt-dots" aria-hidden="true">${inCh.map((_,j)=>`<i class="${j<=k?"on":""}"></i>`).join("")}</span>
      <span style="display:flex;gap:8px"><button class="btn ghost" type="button" data-tt-back${st.i===0?" disabled":""}>${U.back}</button><button class="btn" type="button" data-tt-next>${last?U.done:U.next}</button></span></div>`;
  st.target=null;
  requestAnimationFrame(()=>{ const el=s.el&&$(s.el); st.target=visible(el)?el:null;
    if(st.target) scrollTo(st.target); place(); els.pop.querySelector("[data-tt-next]").focus({preventScroll:true}); }); }

function scrollTo(el){ const r=el.getBoundingClientRect(), vh=innerHeight, mobile=innerWidth<=640;
  const tabs=$("#tabs"), top=(tabs?tabs.getBoundingClientRect().height:0)+16;
  const room=mobile?vh*0.46:vh; // phones: the guide sits in the bottom half
  let y;
  if(r.height+top>room-16) y=r.top-top;                // tall: show its top
  else y=r.top-top-Math.max(0,(room-top-r.height)/2); // short: centre it
  if(Math.abs(y)>4) window.scrollBy({top:y,behavior:"instant"}); }

function place(){ if(!els||!st||st.menu) return; const p=els.pop, sp=els.spot, el=st.target;
  if(!el||!el.isConnected||!visible(el)){ sp.className="center"; sp.style.cssText="left:50%;top:50%"; if(innerWidth>640){ p.style.left=Math.max(12,(innerWidth-p.offsetWidth)/2)+"px"; p.style.top=Math.max(12,(innerHeight-p.offsetHeight)/2)+"px"; } return; }
  const r=el.getBoundingClientRect(), pad=6, vw=innerWidth, vh=innerHeight;
  const L0=Math.max(4,r.left-pad), T0=Math.max(4,r.top-pad), R0=Math.min(vw-4,r.right+pad), B0=Math.min(vh-4,r.bottom+pad);
  sp.className=""; sp.style.cssText=`left:${L0}px;top:${T0}px;width:${Math.max(0,R0-L0)}px;height:${Math.max(0,B0-T0)}px`;
  if(vw<=640) return; // bottom sheet via CSS
  const w=p.offsetWidth, h=p.offsetHeight, g=12; let x, y;
  if(B0+g+h<=vh-g){ y=B0+g; x=r.left; }
  else if(T0-g-h>=g){ y=T0-g-h; x=r.left; }
  else if(R0+g+w<=vw-g){ x=R0+g; y=Math.min(Math.max(g,r.top),vh-h-g); }
  else if(L0-g-w>=g){ x=L0-g-w; y=Math.min(Math.max(g,r.top),vh-h-g); }
  else { x=vw-w-g*2; y=vh-h-g*2; }
  p.style.left=Math.min(Math.max(g,x),vw-w-g)+"px"; p.style.top=Math.min(Math.max(g,y),vh-h-g)+"px"; }

/* ---------- header button, language, first-run ---------- */
function paintBtn(){ const b=$("#telTourBtn"); if(b) b.textContent=UI[L()].guide; }
function rerender(){ paintBtn(); if(!els||!els.pop.isConnected) return; if(st&&st.queue) show(); else if(st&&st.fin) finish(); else menu(); }
document.addEventListener("click",e=>{ if(e.target.closest("[data-lang]")) setTimeout(rerender,0); });
window.TELtour=menu;
function boot(){ const b=$("#telTourBtn"); if(!b) return setTimeout(boot,300);
  b.addEventListener("click",menu); paintBtn();
  // first time this person has a role on this device: offer the guide once
  let tries=0; const wait=setInterval(()=>{ tries++; const r=role(), signed=!$("#telAuth")||$("#telAuth").hidden||!$("#telAuth").isConnected;
    if(r&&signed&&window.TELuserId&&window.TELuserId()){ clearInterval(wait); const k="tel_tour_seen_"+uid()+"_"+r;
      if(!store.get(k)){ store.set(k,1); setTimeout(()=>{ if(!els||!els.pop.isConnected) menu(); },600); } }
    else if(tries>600) clearInterval(wait); },1000); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
