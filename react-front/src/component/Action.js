import { useParams } from "react-router-dom";
import Chat from "./Chat";
import { useEffect, useState } from "react";


function Action() {

    //로딩 스켈레톤을 사용하려면 https://ui.toast.com/weekly-pick/ko_20201110
    /*
    1. useParams() 훅을 이용해서 url의 id값을 얻음
    2. /api/v1/getDetail?id=값 주소로 get요청을 보냅니다. 
    3. 데이터가 도착을 하면 state로 관리하고, 화면에 출력해 주면 됩니다.
    */
    const {num} = useParams();
    const [data, setData] = useState(null);

    useEffect( () => {
        
        (async () => {
            const result = await fetch(`/api/v1/getDetail?id=${num}`).then(response => response.json())
            setData(result);
        })();

    }, [])

  
    return (
        <div className="flex flex-col">
            {/* 상단: 경매 이미지 영역 */}
            {
                /* 이미지가 byte 타입으로 온경우
                data:image/*;base64,데이터
                형식으로 출력합니다.
                */
            }
            <div className="flex justify-center shadow-md">
                <img
                    src={`data:image/*;base64,${data?.imageData}`}
                    alt="경매 이미지"
                    className="h-full object-cover w-full"
                 />
            </div>

            {/* 완료여부 */}
            <span className="text-xs text-gray-500 h-10 flex items-center">👉상태: {data?.status}</span>

            {/* 제목 */}
            <h2 className="text-md font-semibold text-gray-900 truncate h-8 flex items-center">
                {data?.title}
            </h2>

            <p className="text-xs text-gray-500 h-10 flex items-center">
                {data?.description}
            </p>

            <div className="flex justify-between items-center h-12">
                <p className="text-xs text-gray-500 h-10 flex items-center">
                    금액: <span>💸{data?.price}원</span>
                </p>
                <button className="px-4 py-2 text-sm text-white font-medium text-whitehover:bg-red-700 rounded-full transition"
                        style={{backgroundColor: "#FF6600"}}
                        >
                    당근하기
                </button>
            </div>

            {/* 게시글아이디 전달*/}
            {/* 물품상태에 따라서 조건부 렌더링을 합니다*/}

            {
                data?.status==="진행중"?
                <Chat room={num}/>
                :
                <div className="flex justify-center items-center h-64">완료된 물품입니다(조건부 렌더링)</div>
            }

        </div>
    )
}

export default Action;