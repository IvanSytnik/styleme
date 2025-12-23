/**
 * Каталог причесок
 */

import { HairstyleCatalog } from './types';

export const HAIRSTYLES: HairstyleCatalog = {
  // ========== ЖЕНСКИЕ ПРИЧЕСКИ (1-20) ==========
  1: { 
    name: 'Классическое каре', 
    gender: 'female',
    prompt: 'Change the hairstyle to a classic bob haircut, sleek and straight, chin length, clean edges. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  2: { 
    name: 'Удлинённый боб (Лоб)', 
    gender: 'female',
    prompt: 'Change the hairstyle to a long bob (lob) haircut, shoulder length, sleek and shiny, modern style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  3: { 
    name: 'Пикси', 
    gender: 'female',
    prompt: 'Change the hairstyle to a pixie cut, very short and textured, modern edgy feminine look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  4: { 
    name: 'Голливудские локоны', 
    gender: 'female',
    prompt: 'Change the hairstyle to glamorous hollywood waves, big soft curls, voluminous long hair, red carpet style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  5: { 
    name: 'Каскад', 
    gender: 'female',
    prompt: 'Change the hairstyle to a layered cascade haircut, face-framing layers, voluminous and flowing. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  6: { 
    name: 'Пляжные волны', 
    gender: 'female',
    prompt: 'Change the hairstyle to beach waves, relaxed wavy hair, natural tousled texture, effortless summer look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  7: { 
    name: 'Шэг', 
    gender: 'female',
    prompt: 'Change the hairstyle to a shag haircut, heavily layered and textured, 70s rock style with modern touch, messy chic. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  8: { 
    name: 'Прямые длинные', 
    gender: 'female',
    prompt: 'Change the hairstyle to long straight silky hair, smooth glossy shine, flowing down past shoulders. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  9: { 
    name: 'Кудри афро', 
    gender: 'female',
    prompt: 'Change the hairstyle to natural afro curls, voluminous bouncy curly hair, beautiful texture. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  10: { 
    name: 'Французская коса', 
    gender: 'female',
    prompt: 'Change the hairstyle to a french braid, elegant single braid going down the back, neat and polished. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  11: { 
    name: 'Небрежный пучок', 
    gender: 'female',
    prompt: 'Change the hairstyle to a messy bun, relaxed updo on top of head, loose strands framing face, effortless chic. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  12: { 
    name: 'Конский хвост', 
    gender: 'female',
    prompt: 'Change the hairstyle to a sleek high ponytail, hair pulled back tightly, long flowing tail. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  13: { 
    name: 'Косы боксёр', 
    gender: 'female',
    prompt: 'Change the hairstyle to boxer braids, two tight dutch braids going back, sporty athletic style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  14: { 
    name: 'Мальвинка', 
    gender: 'female',
    prompt: 'Change the hairstyle to half-up half-down style, top section pulled back and secured, rest flowing down. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  15: { 
    name: 'Низкий пучок', 
    gender: 'female',
    prompt: 'Change the hairstyle to a low elegant bun at the nape of neck, sophisticated and classy look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  16: { 
    name: 'Асимметричный боб', 
    gender: 'female',
    prompt: 'Change the hairstyle to an asymmetrical bob, one side longer than the other, edgy modern cut. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  17: { 
    name: 'Ретро волны', 
    gender: 'female',
    prompt: 'Change the hairstyle to vintage finger waves, 1920s glamour style, sculpted S-shaped waves. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  18: { 
    name: 'Длинная чёлка', 
    gender: 'female',
    prompt: 'Change the hairstyle to add long curtain bangs, face-framing fringe parted in middle, with flowing hair. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  19: { 
    name: 'Объёмные локоны', 
    gender: 'female',
    prompt: 'Change the hairstyle to big voluminous curls, bouncy ringlets, lots of body and movement. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  20: { 
    name: 'Гладкий хвост', 
    gender: 'female',
    prompt: 'Change the hairstyle to a sleek low ponytail, perfectly smooth and polished, elegant minimalist style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },

  // ========== МУЖСКИЕ ПРИЧЕСКИ (21-40) ==========
  21: { 
    name: 'Фейд', 
    gender: 'male',
    prompt: 'Change the hairstyle to a classic fade haircut, gradually shorter on sides, textured on top. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  22: { 
    name: 'Андеркат', 
    gender: 'male',
    prompt: 'Change the hairstyle to an undercut, shaved sides with longer hair on top, modern disconnected style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  23: { 
    name: 'Помпадур', 
    gender: 'male',
    prompt: 'Change the hairstyle to a pompadour, volume swept up and back from forehead, classic rockabilly style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  24: { 
    name: 'Кроп', 
    gender: 'male',
    prompt: 'Change the hairstyle to a textured crop, short textured top with fringe, faded sides. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  25: { 
    name: 'Квифф', 
    gender: 'male',
    prompt: 'Change the hairstyle to a quiff, volume at front swept upward and back, shorter sides. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  26: { 
    name: 'Бокс', 
    gender: 'male',
    prompt: 'Change the hairstyle to a buzz cut box style, very short all over, clean military look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  27: { 
    name: 'Полубокс', 
    gender: 'male',
    prompt: 'Change the hairstyle to a medium buzz cut, short sides with slightly longer top, neat and clean. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  28: { 
    name: 'Канадка', 
    gender: 'male',
    prompt: 'Change the hairstyle to a classic taper cut (canadka), longer on top gradually shorter to sides, professional look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  29: { 
    name: 'Цезарь', 
    gender: 'male',
    prompt: 'Change the hairstyle to a Caesar cut, short horizontal fringe, same length all around. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  30: { 
    name: 'Мужской пучок', 
    gender: 'male',
    prompt: 'Change the hairstyle to a man bun, long hair tied up in bun on top/back of head. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  31: { 
    name: 'Текстурная стрижка', 
    gender: 'male',
    prompt: 'Change the hairstyle to a textured messy style, choppy layers with movement, modern casual look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  32: { 
    name: 'Под машинку', 
    gender: 'male',
    prompt: 'Change the hairstyle to a buzz cut, very short clipper cut all over, minimal clean style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  33: { 
    name: 'Ёжик', 
    gender: 'male',
    prompt: 'Change the hairstyle to a spiky crew cut, short hair standing up like spikes, youthful edgy look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  34: { 
    name: 'Британка', 
    gender: 'male',
    prompt: 'Change the hairstyle to a British style cut, side part with volume, classic gentleman look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  35: { 
    name: 'Гранж', 
    gender: 'male',
    prompt: 'Change the hairstyle to a grunge style, messy medium length hair, 90s rock aesthetic. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  36: { 
    name: 'Теннис', 
    gender: 'male',
    prompt: 'Change the hairstyle to a tennis haircut, short sides medium top, sporty clean look. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  37: { 
    name: 'Площадка', 
    gender: 'male',
    prompt: 'Change the hairstyle to a flat top, hair cut flat on top like a platform, retro military style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  38: { 
    name: 'Фейд с узором', 
    gender: 'male',
    prompt: 'Change the hairstyle to a fade with hair design, shaved pattern/lines on sides, artistic barber style. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  39: { 
    name: 'Длинные мужские', 
    gender: 'male',
    prompt: 'Change the hairstyle to long flowing mens hair, past shoulders, natural and healthy looking. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
  40: { 
    name: 'Боковой пробор', 
    gender: 'male',
    prompt: 'Change the hairstyle to a classic side part, clean professional look, neatly combed to side. Keep the face exactly the same, only change the hair. Photorealistic.' 
  },
};

export default HAIRSTYLES;
