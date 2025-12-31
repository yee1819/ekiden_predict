import React, { useState, useEffect } from 'react'

import { renderToStaticMarkup } from 'react-dom/server';

import { convert } from 'html-to-text';



function WordCount({ Compiled, components }: { Compiled: React.ComponentType<any> | null; components: any; }) {
  const [wordCountValue, setWordCountValue] = useState<number>(0);
  const [characterCountValue, setCharacterCountValue] = useState<number>(0);


  useEffect(() => {
    if (Compiled) {
      try {
        const html = renderToStaticMarkup(<Compiled components={components} />);
        const plainText = convert(html, {
          wordwrap: false,
        });




        const characterWithLettersCount = (plainText.match(/[\u4e00-\u9fff\u3040-\u30ff]|[a-zA-Z]|[0-9]/gi) || []).length;
        const cleanCharacterCount = plainText
          .replace(/[，。！？；：、“”‘’（）【】——……—《》,.!?:;"'()\[\]\-…<>]/g, '')
          .length;






        // 总字符数

        const characterCount = plainText.length;


        setWordCountValue(characterWithLettersCount);
        setCharacterCountValue(characterCount);

      } catch (error) {
        console.error('计算字数时出错:', error);
      }
    }
  }, [Compiled]);
  return (<>

    <div> 字数: {wordCountValue} 个字 | 字符数: {characterCountValue} 个字符</div>
  </>)
}


export default WordCount