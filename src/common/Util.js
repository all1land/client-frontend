const Util = (function () {
    // 싱글톤 인스턴스
    let instance;

    // 인스턴스 생성 함수
    function createInstance() {
        return {

            ValidKorEng(value) {
                if (value === null || value === undefined || value === '') {
                    return false;
                }

                return /^[A-Za-z가-힣 ]+$/.test(String(value));
            },

            ValidEngUpper(value) {
                if (value === null || value === undefined || value === '') {
                    return false;
                }

                return /^[A-Z_]+$/.test(String(value));
            },
            

            ValidEngNumUpper(value) {
                if (value === null || value === undefined || value === '') {
                    return false;
                }

                return /^[A-Z0-9_]+$/.test(String(value));
            },
            
            formatUnixDate(value) {
                if (value === null || value === undefined || value === '') {
                    return '-';
                }

                const numericValue = Number(value);
                if (Number.isNaN(numericValue)) {
                    return '-';
                }

                // 10-digit unix seconds와 13-digit milliseconds 모두 지원
                const milliseconds = numericValue < 1e12 ? numericValue * 1000 : numericValue;
                const date = new Date(milliseconds);

                if (Number.isNaN(date.getTime())) {
                    return '-';
                }

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');

                return `${year}-${month}-${day}`;
            },
            formatUnixDateTime(value) {
                if (value === null || value === undefined || value === '') {
                    return '-';
                }

                const numericValue = Number(value);
                if (Number.isNaN(numericValue)) {
                    return '-';
                }

                // 10-digit unix seconds와 13-digit milliseconds 모두 지원
                const milliseconds = numericValue < 1e12 ? numericValue * 1000 : numericValue;
                const date = new Date(milliseconds);

                if (Number.isNaN(date.getTime())) {
                    return '-';
                }

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                const minute = String(date.getMinutes()).padStart(2, '0');

                return `${year}-${month}-${day} / ${hour}:${minute}`;
            },
        

        };
    }

    return {
        // 싱글톤 인스턴스를 반환
        getInstance() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        },
    };
})();

export default Util;

// 사용 예시
// Vue 컴포넌트에서 가져오기:
// const util = Util.getInstance();
// 유효성 검사 호출: util.isNumeric("123"), util.formatPhoneNumber("1234567890")

// 혹은 Util.getInstance().isNumeric("123") 로 바로 사용 가능