// Vietnamese content: bike descriptions, FAQ and the one-way route.
// Translated from src/content (English is the reference: change it there first).
// Draft written on 2026-11-22: to be checked by a native speaker.
// "Tiền đặt cọc" is the booking deposit, "tiền thế chân" the security deposit.

import type { TranslatedContent } from "./types";

export const viContent: TranslatedContent = {
  bikes: {
    "wave-alpha-110": {
      summary: "Nhẹ, tiết kiệm và dễ đi: chiếc xe cả Việt Nam đều chạy.",
      description:
        "Wave Alpha là chiếc xe quen thuộc hằng ngày ở Việt Nam. Bốn số, không cần bóp côn nên rất dễ làm quen, xe rất ít hao xăng, và thợ sửa xe ở đâu trong nước cũng sửa được. Lý tưởng để đi lại trong Sài Gòn, hoặc một mình xuyên Việt.",
      bestFor: ["Mới tập chạy xe", "Chuyến đi dài một mình", "Ngân sách ít"],
      seoTitle: "Thuê Honda Wave Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Honda Wave 110 cc ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng, đi đến tận Hà Nội. Dễ đi, tiết kiệm và bền bỉ. Hoàn hảo để khám phá Việt Nam.",
    },
    "suzuki-gd110": {
      summary: "Một chiếc xe côn tay đơn giản, cổ điển.",
      description:
        "GD110 là chiếc xe nhỏ, nhẹ, có côn thật và yên ngồi thẳng, thoải mái. Tiết kiệm và dễ điều khiển, đây là chiếc xe côn tay đầu tiên tốt cho một chuyến đi dài.",
      bestFor: ["Tập đi côn tay", "Ngân sách ít", "Hành lý gọn nhẹ"],
      seoTitle: "Thuê Suzuki GD110 Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Suzuki GD110 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Dễ đi, tiết kiệm và bền bỉ. Có sẵn mũ bảo hiểm.",
    },
    "suzuki-en125": {
      summary: "Một chiếc xe côn tay nhỏ, thoải mái, khỏe hơn một chút.",
      description:
        "EN125 mạnh hơn một chút và có tư thế ngồi rộng rãi hơn, trên nền một chiếc xe côn tay đơn giản, bền bỉ. Lựa chọn hợp lý cho người đi một mình với một chiếc ba lô.",
      bestFor: ["Đi một mình", "Phố và đường trường"],
      seoTitle: "Thuê Suzuki EN125 TP. Hồ Chí Minh | Red Lantern Bikes",
      seoDescription:
        "Thuê Suzuki EN125 ở Sài Gòn theo ngày, tuần hoặc tháng. Thoải mái, bền bỉ và dễ đi. Lý tưởng cho phố và những chuyến đi quanh TP. Hồ Chí Minh.",
    },
    "honda-cb125": {
      summary: "Chiếc naked bike nhẹ, dễ chịu của Honda.",
      description:
        "Một chiếc xe côn tay nhẹ, dễ làm quen, với độ bền của Honda. Đủ thoải mái cho những ngày dài, đủ linh hoạt khi đi trong phố.",
      bestFor: ["Đi một mình", "Mới tập côn tay"],
      seoTitle: "Thuê Honda CB125 Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Honda CB125 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Nhẹ, bền bỉ và dễ đi. Có thể đi một chiều đến Hà Nội hoặc Đà Nẵng. Có sẵn mũ bảo hiểm.",
    },
    "yamaha-nvx125": {
      summary: "Xe tay ga: vặn ga là đi.",
      description:
        "Không phải sang số. NVX êm ái, có cốp dưới yên, và là cách đơn giản nhất để đi lại trong Sài Gòn mà không phải nghĩ đến số.",
      bestFor: ["Đi trong phố", "Không cần sang số", "Đi chơi trong ngày"],
      seoTitle: "Thuê Yamaha NVX Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Yamaha NVX125 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Dễ đi, tiết kiệm và bền bỉ. Hoàn hảo để khám phá Việt Nam. Có sẵn mũ bảo hiểm.",
    },
    "honda-winner-x-150": {
      summary: "Thể thao, bốc và nhẹ, với hộp số sáu cấp.",
      description:
        "Winner X nhẹ như xe tay ga nhưng chạy như một chiếc xe thể thao nhỏ. Đủ mạnh cho quốc lộ và đường đèo, mà vẫn dễ gửi xe và tiết kiệm xăng.",
      bestFor: ["Đường ven biển", "Người đã có chút kinh nghiệm"],
      seoTitle: "Thuê Honda Winner X 150 TP. Hồ Chí Minh | Red Lantern Bikes",
      seoDescription:
        "Thuê Honda Winner X 150 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. 150 cc, nhẹ và phấn khích. Lý tưởng cho người đã có kinh nghiệm.",
    },
    "suzuki-gsx-r150": {
      summary: "Một chiếc 150 cc thể thao cho người thích vào cua.",
      description:
        "Một chiếc 150 cc thể thao, máy bốc và bám đường chắc. Chạy hay nhất trên đường tốt và đường đèo, dành cho người đã quen đi côn tay.",
      bestFor: ["Đèo núi", "Người có kinh nghiệm"],
      seoTitle: "Thuê Suzuki GSX-R150 Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Suzuki GSX-R150 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. 150 cc, nhẹ và phấn khích. Lý tưởng cho người đã có kinh nghiệm.",
    },
    "honda-xr150": {
      summary: "Chiếc xe đi đâu cũng được, được ưa chuộng nhất cho chuyến xuyên Việt.",
      description:
        "Giảm xóc cao, động cơ một xi-lanh khỏe và cấu tạo đơn giản: XR150 không ngại ổ gà, đá sỏi hay mưa. Đây là chiếc xe được thuê nhiều nhất của chúng tôi cho chuyến đi dài đến Hà Nội hoặc Đà Nẵng.",
      bestFor: ["Sài Gòn đến Hà Nội", "Đường xấu", "Chuyến đi dài"],
      seoTitle: "Thuê Honda XR150 TP. Hồ Chí Minh | Red Lantern Bikes",
      seoDescription:
        "Thuê Honda XR150 ở Sài Gòn theo ngày, tuần hoặc tháng. Đi phố lẫn đường địa hình. Xe cào cào 150 cc. Có thể đi một chiều đến Hà Nội.",
    },
    "honda-cb150x": {
      summary: "Một chiếc adventure nhỏ, có kính chắn gió và yên êm.",
      description:
        "CB150X mang sự thoải mái của dòng adventure vào một chiếc 150 cc: kính chắn gió, tư thế ngồi thẳng và chỗ cho hành lý. Lựa chọn thoải mái cho chuyến đi dài Nam – Bắc.",
      bestFor: ["Thoải mái đường dài", "Đi cùng hành lý"],
      seoTitle: "Thuê Honda CB150X Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê xe adventure Honda CB150X ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Đa năng, tư thế ngồi thẳng, hợp cả đi phố lẫn du lịch Việt Nam.",
    },
    "honda-crf150": {
      summary: "Một chiếc xe địa hình thật sự cho đường mòn và vùng quê.",
      description:
        "Giảm xóc hành trình dài và lốp gai sinh ra cho đường địa hình. Hãy chọn xe này nếu cung đường của bạn có đường đất, lội suối hoặc đường mòn trên núi.",
      bestFor: ["Địa hình", "Đường mòn trên núi", "Người có kinh nghiệm"],
      seoTitle: "Thuê Honda CRF150 Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Honda CRF150 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Sinh ra cho đường đất và đường mòn. Có thể đi một chiều đến Hà Nội hoặc Đà Nẵng.",
    },
    "yamaha-wr155r": {
      summary: "Một chiếc cào cào bốc cho người muốn mạnh hơn.",
      description:
        "Một chiếc cào cào hiện đại với động cơ mạnh, thích vòng tua cao. Nhanh trên đường nhựa và vững trên đường địa hình, dành cho người có kinh nghiệm muốn thêm chút sức mạnh.",
      bestFor: ["Đường nhựa và địa hình", "Người có kinh nghiệm"],
      seoTitle: "Thuê Yamaha WR155R Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê xe cào cào Yamaha WR155R ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Nhanh trên đường nhựa, vững trên địa hình. Có thể đi một chiều đến Hà Nội hoặc Đà Nẵng.",
    },
    "kawasaki-versys-x300": {
      summary: "Chiếc xe lớn nhất của chúng tôi: hai xi-lanh cho đường dài.",
      description:
        "Versys X300 đủ sức chạy quốc lộ cả ngày, chở hai người hoặc chở nhiều hành lý, và có thùng sau. Lựa chọn của chúng tôi để đi Sài Gòn – Hà Nội thật thoải mái.",
      bestFor: ["Sài Gòn đến Hà Nội", "Chở hai người", "Đi quốc lộ"],
      seoTitle: "Thuê Kawasaki Versys X300 Sài Gòn | Red Lantern Bikes",
      seoDescription:
        "Thuê Kawasaki Versys X300 ở TP. Hồ Chí Minh theo ngày, tuần hoặc tháng. Hoàn hảo cho chuyến một chiều đến Hà Nội hoặc Đà Nẵng. Xe adventure 300 cc. Có sẵn mũ bảo hiểm và baga chở đồ.",
    },
  },
  licence: {
    IDP_OR_A1:
      "Cần bằng lái xe máy Việt Nam, hoặc giấy phép lái xe quốc tế (Công ước Viên 1968) có giá trị cho xe máy.",
    A2: "Trên 175 cc: cần bằng lái xe máy Việt Nam, hoặc giấy phép lái xe quốc tế (Công ước Viên 1968) có giá trị cho xe máy.",
  },
  kinds: {
    "Semi-automatic": "Xe số",
    Manual: "Xe côn tay",
    "Automatic scooter": "Xe tay ga",
    "Manual sport": "Xe côn tay thể thao",
    "Manual dual-sport": "Xe cào cào côn tay",
    "Manual adventure": "Xe adventure côn tay",
    "Manual dirt": "Xe địa hình",
  },
  faq: [
    {
      id: "licence",
      question: "Tôi cần bằng lái gì?",
      answer: [
        "Chỉ bằng lái của nước bạn thì chưa đủ ở Việt Nam.",
        "Với tất cả xe của chúng tôi, từ Wave 110 cc đến Kawasaki Versys X300, bạn cần bằng lái xe máy Việt Nam, hoặc giấy phép lái xe quốc tế cấp theo Công ước Viên 1968 và có giá trị cho xe máy.",
      ],
    },
    {
      id: "booking",
      question: "Đặt xe và tiền đặt cọc hoạt động thế nào?",
      answer: [
        "Chọn ngày và xe trên trang đặt xe, bạn sẽ thấy tổng giá. Sau đó gửi yêu cầu đặt xe: hoàn toàn miễn phí. Chúng tôi giữ xe trong lúc xem yêu cầu và trả lời qua email, thường trong vài giờ và chậm nhất trong 24 giờ.",
        "Khi đơn đã được xác nhận, chúng tôi liên hệ để thống nhất khoản tiền đặt cọc 1.500.000 ₫ (hoặc toàn bộ giá thuê, nếu thấp hơn). Tiền đặt cọc là một phần của giá thuê, không tính thêm, và không được hoàn lại. Phần còn lại trả khi nhận xe.",
      ],
    },
    {
      id: "payment",
      question: "Thanh toán thế nào?",
      answer: [
        "Bạn không phải trả gì trên trang web. Khi đơn đã được xác nhận, chúng tôi liên hệ trực tiếp để thống nhất tiền đặt cọc. Phần còn lại có thể trả bằng tiền mặt khi nhận xe. Hiện chúng tôi chưa nhận thẻ.",
      ],
    },
    {
      id: "prices",
      question: "Giá thuê dài ngày tính thế nào?",
      answer: [
        "Mỗi xe có giá theo ngày, giảm dần theo thời gian thuê: theo ngày, theo tuần từ 7 ngày, 3 tuần từ 21 ngày, theo tháng từ 30 ngày và 45 ngày từ 45 ngày. Giá của mức thời gian bạn thuê áp dụng cho mọi ngày của chuyến thuê. Một chuyến thuê không bao giờ đắt hơn chuyến dài hơn: nếu 30 ngày rẻ hơn 26 ngày, bạn trả giá 30 ngày.",
        "Ngày nhận xe và ngày trả xe đều được tính là ngày thuê.",
      ],
    },
    {
      id: "included",
      question: "Những gì đi kèm?",
      answer: [
        "Mỗi xe đi kèm một mũ bảo hiểm đã qua sử dụng, giá đỡ điện thoại, baga chở đồ và dây ràng hành lý, bản đồ trực tuyến những cung đường đẹp nhất Việt Nam, và hỗ trợ dọc đường khắp Việt Nam.",
      ],
    },
    {
      id: "insurance",
      question: "Có bảo hiểm không?",
      answer: [
        "Bảo hiểm toàn diện là tùy chọn, giá mỗi ngày tùy theo cỡ xe: 80.000 ₫ cho xe 110 đến 125 cc, 130.000 ₫ cho xe 150 cc, 180.000 ₫ cho CB150X, CRF150 và WR155R, và 260.000 ₫ cho Kawasaki Versys X300. Thêm bảo hiểm khi đặt xe.",
        "Bảo hiểm chi trả tai nạn trên đường, thủng lốp và hỏng hóc máy móc do chính chiếc xe, trừ khi do người lái gây ra. Bảo hiểm không chi trả mất cắp, các việc liên quan đến công an, ngập nước, thiệt hại cho người khác và vấn đề sức khỏe.",
        "Bảo hiểm chỉ áp dụng nếu bạn tuân thủ hai quy tắc. Mỗi lần thay nhớt trong chuyến đi phải làm đúng cách, và mỗi lần bạn gửi cho chúng tôi một ảnh thợ đang thay nhớt và một ảnh toàn bộ đồng hồ công-tơ-mét. Và bạn liên hệ với chúng tôi trước khi sửa bất cứ gì: nếu bạn gọi khi thợ đã bắt đầu sửa xe, hoặc sau khi sửa xong, chúng tôi không chi trả.",
        "Không có bảo hiểm, chúng tôi chỉ chịu trách nhiệm hỏng động cơ. Tai nạn, các sửa chữa khác và mất cắp do người lái chịu.",
      ],
    },
    {
      id: "security-deposit",
      question: "Có tiền thế chân không?",
      answer: [
        "Có, khi nhận xe: để lại hộ chiếu, hoặc tiền mặt 300 US$ cho xe tay ga hay 500 US$ cho xe côn tay. Bạn nhận lại khi trả xe.",
        "Bạn phải từ 18 tuổi trở lên để thuê xe.",
      ],
    },
    {
      id: "breakdown",
      question: "Nếu xe bị hỏng thì sao?",
      answer: [
        "Nhắn WhatsApp cho chúng tôi trước khi bất kỳ ai đụng vào xe, dù bạn ở đâu tại Việt Nam. Chúng tôi hướng dẫn bạn, tìm thợ gần bạn hoặc sắp xếp hỗ trợ. Việc sửa chữa bắt đầu trước khi liên hệ với chúng tôi sẽ không được bảo hiểm chi trả.",
      ],
    },
    {
      id: "one-way",
      question: "Chuyến một chiều hoạt động thế nào?",
      answer: [
        "Nhận xe ở Sài Gòn và để xe tại điểm trả xe đối tác của chúng tôi, gần trung tâm thành phố, ở Hà Nội (thuê từ 12 ngày) hoặc Đà Nẵng (từ 7 ngày). Phí một chiều, tùy theo xe, được cộng vào giá. Chúng tôi lo việc đưa xe về Sài Gòn.",
        "Muốn kết thúc ở Đà Lạt, Huế hoặc Nha Trang? Những nơi này không đặt được trực tuyến, nhưng hãy nhắn tin cho chúng tôi và chúng tôi có thể sắp xếp.",
      ],
    },
    {
      id: "start-north",
      question: "Tôi có thể bắt đầu từ Hà Nội hoặc Đà Nẵng không?",
      answer: [
        "Chúng tôi tự sắp xếp các chuyến từ Hà Nội hoặc Đà Nẵng về Sài Gòn, nên không đặt được trực tuyến. Gửi tin nhắn cho chúng tôi với ngày đi và chiếc xe bạn muốn, chúng tôi sẽ cho bạn biết những gì có thể làm.",
      ],
    },
    {
      id: "return",
      question: "Khi nào trả xe, và nếu tôi trả trễ?",
      answer: [
        "Điểm trả xe ở Đà Nẵng và Hà Nội nhận xe từ 9 giờ đến 16 giờ. Ở Sài Gòn chúng tôi linh hoạt hơn: hãy cho chúng tôi biết giờ phù hợp với bạn.",
        "Trả trễ được tính theo giờ, theo mức ghi trong hợp đồng thuê xe.",
      ],
    },
    {
      id: "early-return",
      question: "Nếu tôi trả xe sớm thì sao?",
      answer: [
        "Không sao, nhưng giá vẫn giữ như khi đặt: những ngày không dùng sẽ không được hoàn tiền.",
      ],
    },
    {
      id: "cancel",
      question: "Tôi có thể hủy không?",
      answer: [
        "Có. Khi chúng tôi chưa xác nhận đơn và bạn chưa trả tiền đặt cọc, bạn không mất gì. Sau khi đã trả, tiền đặt cọc không được hoàn lại, nhưng bạn không phải trả thêm gì. Nếu kế hoạch thay đổi, hãy nhắn tin cho chúng tôi và chúng tôi sẽ cố gắng dời ngày cho bạn.",
      ],
    },
    {
      id: "delivery",
      question: "Có giao xe đến khách sạn của tôi không?",
      answer: [
        "Có, miễn phí, ở Quận 1 hoặc gần đó. Ghi vào phần ghi chú khi đặt xe, hoặc nhắn tin cho chúng tôi.",
      ],
    },
  ],
  route: {
    Saigon: {
      city: "Sài Gòn",
      note: "Khởi hành từ Quận 1",
      detail:
        "Chúng tôi chuẩn bị xe cho chuyến đi dài, cùng bạn xem lại cung đường và chúc bạn thượng lộ bình an.",
    },
    "Da Nang": {
      city: "Đà Nẵng",
      note: "10 đến 14 ngày",
      detail:
        "Tây Nguyên, biển Nha Trang và cung đường ven biển. Để xe tại điểm trả xe của chúng tôi rồi bay về hoặc đi tiếp bằng tàu hỏa.",
    },
    Hanoi: {
      city: "Hà Nội",
      note: "21 đến 30 ngày",
      detail:
        "Cả đất nước: đèo Hải Vân, Huế, Phong Nha và núi đá vôi miền Bắc. Phần lớn mọi người đi trong ba đến bốn tuần.",
    },
  },
  included: [
    "Mũ bảo hiểm đã qua sử dụng",
    "Giá đỡ điện thoại",
    "Baga chở đồ và dây ràng hành lý",
    "Bản đồ trực tuyến những cung đường đẹp nhất Việt Nam",
    "Hỗ trợ dọc đường khắp Việt Nam, qua WhatsApp",
    "Giao xe miễn phí đến khách sạn của bạn ở Quận 1 hoặc gần đó",
  ],
  hours: "Mở cửa hằng ngày, 8 giờ đến 20 giờ",
  addOns: {
    insurance: {
      name: "Bảo hiểm toàn diện",
      description:
        "Chi trả tai nạn trên đường, thủng lốp và hỏng hóc máy móc do chính chiếc xe. Không chi trả: mất cắp, các việc liên quan đến công an, ngập nước, thiệt hại cho người khác, vấn đề sức khỏe. Bắt buộc gửi ảnh mỗi lần thay nhớt và gọi trước khi sửa bất cứ gì.",
    },
    "premium-helmet": {
      name: "Mũ bảo hiểm cao cấp",
      description: "Cho thuê theo chuyến, trả lại cùng xe. Một cái cho người lái, một cái cho người ngồi sau.",
    },
    gloves: {
      name: "Găng tay đi xe máy",
      description: "Mua đứt, là của bạn: không cần trả lại. Giá mỗi đôi.",
    },
  },
};
