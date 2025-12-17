import {Fragment, useRef, useState} from "react";
import emptyImg from '../img/emtry_img.png';
import {Link, useNavigate} from "react-router-dom";

function Regist() {
    /* 백버튼 */
    const nav = useNavigate()
    /* 이미지 업로드기능 */
    const [image, setImage] = useState(emptyImg);
    const fileInputRef = useRef();

    const imageClick = (e) => {
        fileInputRef.current.click();
    }
    const imageChange = (e) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
        }
    }
    /* 이미지 업로드기능 end */

    ///////////////////////여기서부터 코드작성///////////////////////////
    //여러 인풋값을 하나의 state로 관리, 이미지는 위에서 ref로 관리


    //step.1 - app.js에 AuthHandler 핸들러 등록

    const[data,setData]=useState({title:'',price:'',description:''});
    const handleChange=e=>{
        setData(prev=>{
            //{...prev(복사된값),[키]:값}
            //기존 객체를 복사하고, [key]:value로 input data를 변경처리
            return {...prev,[e.target.name]:e.target.value}
        })
    }
    console.log(data);
    
    //등록버튼
    const registForm=async(e)=>{
        //버튼 비활성화
        e.target.disabled=true;

        //multipart데이터 -> formData객체
        //일반form 데이터 -> URLSearchParams객체
        let formData=new FormData();
        formData.append("title",data.title);
        formData.append("description",data.description);
        formData.append("price",data.price);
        formData.append("file",fileInputRef.current.files?.[0]); // input file tag에 접근 / ?는 null처리


        //세션스토리지 토큰정보
        const token=sessionStorage.getItem("token");

        try{
            const response=await fetch("/api/v1/save",{
            method:"post",
            headers:{
                //multipart데이터는 contentType을 지정하지 않아야, fetch가 자동으로 multipart 유형으로 선언함
                //값없음!
                Authorization: `Bearer ${token}`
            },
            body:formData
           })
            console.log(response);

            if(response.status===200){
                //성공시 처리
                alert("등록이 완료하였읍니다.")
                nav("/"); //홈화면으로 이동
            }else{
                //실패시 처리
                alert("등록이 실패하였읍니다.")
                e.target.disabled=false; //버튼 활성화
            }
        }catch(e){
            console.error("서버에 에러가 발생했읍니다.",e);    
            
        }
        
    }

    return (
        <Fragment>
            <div className="bg-white shadow-md flex justify-between items-center px-3 py-3 h-12">
                <button className="text-gray-700"
                        onClick={()=>nav(-1)}
                        >
                        {/*백버튼*/}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M15 19l-7-7 7-7"/>
                        </svg>
                </button>

                <Link to={"/"} className="text-sm text-gray-700 font-medium mr-1">
                    홈
                </Link>
            </div>

            <div className="p-2.5">
            <div className="max-w-md mx-auto mb-2"
                 onClick={imageClick}
                >
                <label className="block text-md font-bold text-gray-700 mb-2">
                    당근 등록
                </label>
                <div className="bg-white border shadow-md overflow-hidden">
                    <img src={image} alt="미리보기" className="w-50 h-48 mx-auto object-cover" />
                </div>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={imageChange}
                    ref={fileInputRef}
                />
            </div>

            <div
                className="w-full max-w-md mx-auto mb-2"
                >
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    당근할 물품
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="아이템"
                    className="w-full px-3 py-1 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={data.title}
                />
            </div>

            <div className="w-full max-w-md mx-auto mb-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    판매금액
                </label>
                <input
                    type="number"
                    id="price"
                    name="price"
                    placeholder="5000"
                    className="w-full px-3 py-1 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={data.price}
                />
            </div>

            <div
                className="w-full max-w-md mx-auto mb-2"
                >
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    자세한 설명
                </label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="상품을 설명해주세요"
                    className="w-full h-32 px-3 py-1 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={data.description}
                />
            </div>

            <div className="flex justify-end">
                <button className="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-600"
                        onClick={registForm}
                        >
                    시작하기
                </button>
            </div>

        </div>
        </Fragment>
    )
}

export default Regist;