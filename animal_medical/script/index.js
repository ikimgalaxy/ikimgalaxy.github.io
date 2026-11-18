/* 진료센터 탭메뉴 */
const centerTabTitle = document.querySelectorAll('.medical_center .tab_title a')
const centerTabContents = document.querySelectorAll('.medical_center .tab_contents > div')
console.log(centerTabTitle, centerTabContents)
for(let i of centerTabContents){i.style.display = 'none'}
centerTabContents[1].style.display = 'block'
centerTabTitle.forEach(function(t, i, a){
    t.addEventListener('click',function(e){
        e.preventDefault()
        for(let i of centerTabTitle){i.classList.remove('active')}
        t.classList.add('active')
        for(let i of centerTabContents){i.style.display = 'none'}
        centerTabContents[i].style.display = 'block'
    })
})