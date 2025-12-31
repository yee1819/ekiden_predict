'use client'
function MyButton({ children, clickText }: { children: React.ReactNode, clickText: any }) {
    clickText = clickText || '点击了按钮';
    return (
      <button onClick={() => alert(clickText)} className="bg-blue-500 text-white px-2 py-1 rounded">
        {children}
      </button>
    );
  }

export default MyButton ;